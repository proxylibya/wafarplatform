#!/usr/bin/env node
// Seals or opens a backup archive: AES-256-GCM under a random data key, itself
// wrapped by the environment's key-encryption key. No dependency is added; the
// archive is unreadable without the key, which is never stored beside it
// (Complexity Tracking row 17, FR-055).
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const MAGIC = Buffer.from('WFARSEAL1');

function kek() {
  const raw = process.env['BACKUP_KEY_ENCRYPTION_KEY'];
  if (!raw) throw new Error('BACKUP_KEY_ENCRYPTION_KEY is not set');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('the key-encryption key must be 32 bytes, base64');
  return key;
}

function seal(input) {
  const dataKey = randomBytes(32);
  const dataIv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', dataKey, dataIv);
  const ciphertext = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();

  const wrapIv = randomBytes(12);
  const wrapper = createCipheriv('aes-256-gcm', kek(), wrapIv);
  const wrapped = Buffer.concat([wrapper.update(dataKey), wrapper.final()]);
  const wrapTag = wrapper.getAuthTag();

  return Buffer.concat([
    MAGIC,
    wrapIv,
    wrapTag,
    wrapped,
    dataIv,
    tag,
    ciphertext,
  ]);
}

function open(input) {
  if (!input.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('not a sealed archive');
  }
  let offset = MAGIC.length;
  const wrapIv = input.subarray(offset, (offset += 12));
  const wrapTag = input.subarray(offset, (offset += 16));
  const wrapped = input.subarray(offset, (offset += 32));
  const dataIv = input.subarray(offset, (offset += 12));
  const tag = input.subarray(offset, (offset += 16));
  const ciphertext = input.subarray(offset);

  const unwrapper = createDecipheriv('aes-256-gcm', kek(), wrapIv);
  unwrapper.setAuthTag(wrapTag);
  const dataKey = Buffer.concat([unwrapper.update(wrapped), unwrapper.final()]);

  const decipher = createDecipheriv('aes-256-gcm', dataKey, dataIv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

const [mode, source, target] = process.argv.slice(2);
if (mode !== 'seal' && mode !== 'open') {
  console.error('usage: seal.mjs seal <input> <output> | seal.mjs open <input> <output>');
  process.exit(2);
}

const input = readFileSync(source);
writeFileSync(target, mode === 'seal' ? seal(input) : open(input));
console.log(`${mode === 'seal' ? 'sealed' : 'opened'} ${source} -> ${target}`);
