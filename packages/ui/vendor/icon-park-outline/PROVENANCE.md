# IconPark — provenance and scan record

**Cut.** IconPark Outline (consumed by `WfIcon`).

**Licence.** Apache License, Version 2.0; the full text is `LICENCE.txt` beside
this file. Upstream: <https://github.com/bytedance/IconPark> (archived;
ADR-098 fixes the set and records that the project owns this copy).

**Source of the copy.** `@iconify-json/icon-park-outline` version **1.2.4**,
whose `iconSetVersion` is **1.4.2** and whose Iconify set name is
`icon-park-outline` (2,658 icons). The package's `gitHead` is
`599f41e13dd0e25f5e546d7d6094b8bdad63008f` in the `iconify/icon-sets`
repository, and its npm integrity is
`sha512-NyZxXe2gD2TbTOyoRRMdtEJhr6i2KQCdDlYYoOn5oZLndQjwpIhw79hzeFhXvP38/o40D3gQ+l+IaSJgbB+0TQ==`.

**Pin.** `SHA256SUMS` records the digest of the vendored set and its icon count
(2,658). The copy is not modified beyond extraction to standalone `.svg` files.
No runtime Iconify API is read, and no build or runtime path depends on the
archived upstream (ADR-098 decision 1).

**Vulnerability scan (2026-11-07).** `pnpm audit` reported **0** advisories for
`@iconify-json/icon-park-outline` 1.2.4. Every vendored `.svg` was scanned for
`<script`, `javascript:` URLs, and inline `on*=` handlers; **0** active-content
matches were found. The files are static artwork consumed by `WfIcon`.

**Refresh rule.** The upstream is archived. A missing icon is added by ADR, and
a set change moves the vendored files, `SHA256SUMS`, this record, and
ADR-098's annotation together (ADR-098, AGENTS.md §6).
