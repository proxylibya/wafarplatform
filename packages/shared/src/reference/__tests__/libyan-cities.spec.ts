// Unit test the city list: every one of the 22 governorates present with at
// least one entry, the reviewed entry count, unique non-empty Arabic names, a
// representative set of cities and areas beyond the governorate floor, and the
// recorded digest (FR-005, AC-005; ADR-152 as amended by ADR-161).
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import cities from '../libyan-cities.json' with { type: 'json' };
import prefixes from '../libyan-mobile-prefixes.json' with { type: 'json' };
import { normalizeArabic } from '../../normalize/arabic.ts';

const GOVERNORATES = [
  'البطنان',
  'درنة',
  'الجبل الأخضر',
  'المرج',
  'بنغازي',
  'الواحات',
  'الكفرة',
  'سرت',
  'الجفرة',
  'مصراتة',
  'المرقب',
  'طرابلس',
  'الجفارة',
  'الزاوية',
  'النقاط الخمس',
  'الجبل الغربي',
  'نالوت',
  'غات',
  'وادي الشاطئ',
  'سبها',
  'وادي الحياة',
  'مرزق',
];

// The reviewed dataset's count, read from the reference's own entry list.
const REVIEWED_ENTRY_COUNT = 138;

// A representative set of cities and areas, one per governorate or region,
// beyond the 22 governorate names the floor asserts.
const REPRESENTATIVE = [
  'طبرق',
  'درنة',
  'البيضاء',
  'شحات',
  'المرج',
  'الأبيار',
  'بنغازي',
  'قمينس',
  'أجدابيا',
  'جالو',
  'الجوف',
  'تازربو',
  'سرت',
  'رأس لانوف',
  'هون',
  'ودان',
  'مصراتة',
  'زليتن',
  'الخمس',
  'ترهونة',
  'مسلاتة',
  'بني وليد',
  'طرابلس',
  'تاجوراء',
  'جنزور',
  'العزيزية',
  'الزاوية',
  'صرمان',
  'صبراتة',
  'زوارة',
  'غريان',
  'يفرن',
  'الزنتان',
  'نالوت',
  'غدامس',
  'غات',
  'براك',
  'سبها',
  'أوباري',
  'مرزق',
  'القطرون',
];

describe('the Libyan city list', () => {
  it('covers all 22 governorates and records the count', () => {
    expect(cities.governorateCount).toBe(22);
    for (const governorate of GOVERNORATES) {
      expect(cities.entries, governorate).toContain(governorate);
    }
  });

  it('carries the reviewed entry count', () => {
    expect(cities.entryCount).toBe(cities.entries.length);
    expect(cities.entryCount).toBe(REVIEWED_ENTRY_COUNT);
  });

  it('names a representative set of cities and areas beyond the governorate floor', () => {
    for (const name of REPRESENTATIVE) {
      expect(cities.entries, name).toContain(name);
    }
  });

  it('holds unique, non-empty, Arabic names with no Latin alternate', () => {
    expect(new Set(cities.entries).size).toBe(cities.entries.length);
    for (const name of cities.entries) {
      expect(name.trim().length).toBeGreaterThan(0);
      expect(/[\u0600-\u06FF]/.test(name)).toBe(true);
      expect(/[A-Za-z]/.test(name)).toBe(false);
    }
  });

  it('matches names diacritic-insensitively and stores the exact name', () => {
    expect(normalizeArabic('بَنغازي')).toBe(normalizeArabic('بنغازي'));
    expect(cities.entries.includes('بنغازي')).toBe(true);
  });

  it('carries the digest of its own entries', () => {
    const digest = createHash('sha256')
      .update(JSON.stringify(cities.entries))
      .digest('hex');
    expect(cities.sha256).toBe(digest);
  });

  it('carries a digest of the mobile prefix set', () => {
    const digest = createHash('sha256')
      .update(JSON.stringify(prefixes.prefixes))
      .digest('hex');
    expect(prefixes.sha256).toBe(digest);
  });
});
