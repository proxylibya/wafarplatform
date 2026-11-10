// Unit test the pending request's state machine: replacement per number, the
// re-request allowance, the incorrect-entry bound, expiry, and the send rule
// (FR-034, FR-038, AC-036, AC-041).
import { describe, expect, it } from 'vitest';
import type { SmsMessage, SmsResult, SmsTransport } from '../../../auth/sms/port.ts';
import { createPendingRequestService, type PendingStore } from '../pending-request.ts';
import type { PendingRow } from '../../repository/phone-verifications.ts';

class MemoryStore implements PendingStore {
  rows = new Map<string, PendingRow>();

  async findByPhone(phoneNumber: string): Promise<PendingRow | null> {
    for (const row of this.rows.values()) {
      if (row.phoneNumber === phoneNumber) return row;
    }
    return null;
  }
  async findById(id: string): Promise<PendingRow | null> {
    return this.rows.get(id) ?? null;
  }
  async upsert(row: PendingRow): Promise<void> {
    for (const [id, existing] of this.rows) {
      if (existing.phoneNumber === row.phoneNumber) this.rows.delete(id);
    }
    this.rows.set(row.id, row);
  }
  async deleteById(id: string): Promise<void> {
    this.rows.delete(id);
  }
  async deleteByPhone(phoneNumber: string): Promise<void> {
    for (const [id, row] of this.rows) {
      if (row.phoneNumber === phoneNumber) this.rows.delete(id);
    }
  }
  async incrementIncorrect(id: string, _now: Date): Promise<number> {
    const row = this.rows.get(id);
    if (!row) return 0;
    row.incorrectEntries += 1;
    return row.incorrectEntries;
  }
  async claimReRequest(id: string, _now: Date, max: number): Promise<number | null> {
    const row = this.rows.get(id);
    if (!row || row.state !== 'pending' || row.reRequests >= max) return null;
    row.reRequests += 1;
    return row.reRequests;
  }
  async releaseReRequest(id: string, _now: Date): Promise<void> {
    const row = this.rows.get(id);
    if (row) row.reRequests = Math.max(row.reRequests - 1, 0);
  }
  async updateCode(input: {
    id: string;
    codeHash: string;
    previousCodeHash: string;
    codeExpiresAt: Date;
    requestExpiresAt: Date;
    now: Date;
  }): Promise<void> {
    const row = this.rows.get(input.id);
    if (!row || row.state !== 'pending') return;
    row.codeHash = input.codeHash;
    row.previousCodeHash = input.previousCodeHash;
    row.codeExpiresAt = input.codeExpiresAt;
    row.requestExpiresAt = input.requestExpiresAt;
  }
  async markVerified(id: string, now: Date): Promise<void> {
    const row = this.rows.get(id);
    if (row) {
      row.state = 'verified';
      row.verifiedAt = now;
    }
  }
}

class StubSms implements SmsTransport {
  result: SmsResult = 'accepted';
  sent: SmsMessage[] = [];
  async send(message: SmsMessage): Promise<SmsResult> {
    if (this.result === 'accepted') this.sent.push(message);
    return this.result;
  }
  acceptanceEstimateMs(): number {
    return 0;
  }
  lastCode(): string | null {
    const body = this.sent.at(-1)?.body ?? '';
    return /(\d{6})/.exec(body)?.[1] ?? null;
  }
}

const now = new Date('2026-11-05T09:00:00.000Z');

function setup() {
  const store = new MemoryStore();
  const sms = new StubSms();
  const service = createPendingRequestService(store, sms);
  return { store, sms, service };
}

describe('the pending request', () => {
  it('writes one row per number and replaces it in place', async () => {
    const { store, service, sms } = setup();
    const first = await service.start({
      phoneNumber: '+218912345678',
      purpose: 'sign_up',
      fullName: 'محمد',
      city: 'طرابلس',
      passwordHash: '$wafar$scrypt$x',
      now,
    });
    expect(first.status).toBe('accepted');
    const second = await service.start({
      phoneNumber: '+218912345678',
      purpose: 'recovery',
      now,
    });
    expect(second.status).toBe('accepted');
    expect(store.rows.size).toBe(1);
    expect(sms.sent).toHaveLength(2);
  });

  it('writes nothing when the channel refuses', async () => {
    const { store, service, sms } = setup();
    sms.result = 'refused';
    const result = await service.start({
      phoneNumber: '+218912345678',
      purpose: 'sign_up',
      fullName: 'محمد',
      city: 'طرابلس',
      passwordHash: '$wafar$scrypt$x',
      now,
    });
    expect(result.status).toBe('send_failed');
    expect(store.rows.size).toBe(0);
  });

  it('accepts three new codes and refuses the fourth', async () => {
    const { service, sms } = setup();
    const started = await service.start({
      phoneNumber: '+218912345678',
      purpose: 'sign_up',
      now,
    });
    if (started.status !== 'accepted') throw new Error('start failed');
    let row = started.row;
    for (let index = 0; index < 3; index += 1) {
      const resent = await service.resend(row, now);
      expect(resent.status).toBe('accepted');
      if (resent.status !== 'accepted') throw new Error('resend failed');
      row = resent.row;
    }
    expect((await service.resend(row, now)).status).toBe('limit');
    expect(sms.sent).toHaveLength(4);
  });

  it('spends no allowance on a refused resend', async () => {
    const { service, sms } = setup();
    const started = await service.start({
      phoneNumber: '+218912345678',
      purpose: 'sign_up',
      now,
    });
    if (started.status !== 'accepted') throw new Error('start failed');
    sms.result = 'timed_out';
    expect((await service.resend(started.row, now)).status).toBe('send_failed');
    sms.result = 'accepted';
    const resent = await service.resend(started.row, now);
    expect(resent.status).toBe('accepted');
    if (resent.status === 'accepted') expect(resent.row.reRequests).toBe(1);
  });

  it('counts five wrong live values and then ends the request', async () => {
    const { service, store } = setup();
    const started = await service.start({
      phoneNumber: '+218912345678',
      purpose: 'sign_up',
      now,
    });
    if (started.status !== 'accepted') throw new Error('start failed');

    for (let index = 0; index < 4; index += 1) {
      const result = await service.consume(started.row, '000000', now);
      expect(result.status).toBe('incorrect');
    }
    const ended = await service.consume(started.row, '000000', now);
    expect(ended.status).toBe('ended');
    expect(store.rows.size).toBe(0);
  });

  it('refuses a code after its lifetime without counting it', async () => {
    const { service } = setup();
    const started = await service.start({
      phoneNumber: '+218912345678',
      purpose: 'sign_up',
      now,
    });
    if (started.status !== 'accepted') throw new Error('start failed');
    const later = new Date(now.getTime() + 301_000);
    expect((await service.consume(started.row, '000000', later)).status).toBe(
      'expired',
    );
  });

  it('moves a recovery row to verified and never verifies it twice', async () => {
    const { service, sms } = setup();
    const started = await service.start({
      phoneNumber: '+218912345678',
      purpose: 'recovery',
      now,
    });
    if (started.status !== 'accepted') throw new Error('start failed');
    const code = sms.lastCode();
    if (code === null) throw new Error('no code');
    expect((await service.consume(started.row, code, now)).status).toBe('verified');
    expect((await service.consume(started.row, code, now)).status).toBe('expired');
  });
});
