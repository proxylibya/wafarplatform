# Capacity Model — Wafar

**Status**: Adopted by ADR-117 on 2026-10-23; the quota model was ratified by
ADR-118 (constitution 4.0.0); the first sample calibrated the envelope in
ADR-119; ADR-121 accepts the 2–3 billion parts range and fixes the partitioning
constraint, and ADR-122 fixes the local-first OCR policy. Project-level planning
document.
**Scope**: the six-month launch horizon only. This document defines no second
horizon.

**Authority**: this document is the planning authority for the load envelope, the
ingestion envelope, and the capacity assumptions a plan's `Scale/Scope` records.
It is read with the constitution, not in place of it. The constitution wins on
every conflict.

**Binding limits.** The constitution binds 50 uploads per calendar month, 300
active stored files, and no lifetime total. The administrator may grant a
per-user exception of up to 500 uploads per calendar month and 1,500 active
stored files; a value above either ceiling requires an amendment.

---

## 1. Purpose

The product is a search-and-display catalog, not a marketplace. Its load is
therefore split into two different systems:

1. **Read traffic** — public pages, the parts table, Arabic search, filters, and
   the merchant's authenticated pages.
2. **Ingestion** — upload, storage, duplicate detection, extraction, OCR where
   required, normalisation, deduplication, indexing, and retention.

Read traffic is the smaller problem. The ingestion pipeline is the capacity
constraint, and the scanned Arabic table is its hardest input. This document
sizes both, states the assumptions each number depends on, and names the point
at which the model must be re-run.

## 2. Definitions

| Term | Meaning |
|---|---|
| **Registered account** | A `User` row. It is a data-volume figure, never a concurrency figure. |
| **Active stored file** | A catalog whose bytes and extracted data are still present. A soft-deleted catalog does not count once its bytes, parts, bookmarks, and index entries are withdrawn. |
| **Upload event** | One accepted file upload. The monthly quota counts upload events; the active quota counts active stored files. |
| **Visit** | One visitor session in a day. It is not a request and not a concurrent user. |
| **Concurrent online** | A session that is open at the same moment. It is not a request per second. |
| **Concurrent upload** | A file transfer in flight at the same moment. It is not a monthly uploader count. |
| **Design load** | The load the six-month baseline is planned against. |
| **Stress load** | The load the same components must survive without architectural change, before a new sizing decision. |

## 3. Six-month envelope

The six-month plan is 10,000 registered accounts. The platform is sized to hold
50,000 accounts without a new architectural decision, and is stress-tested at
the ingestion volume that 50,000 accounts can produce.

The first 19-file sample (2026-10-23) measured 2.28 MB average, 80.3 pages per
file, 31.7 rows per page, and 5.3% scanned files. It is a planning base from one
sample, not a final measurement. The pre-sample envelope is retained as the
scanned-heavy stress case; it is not the measured baseline. ADR-119 records the
calibration, and `docs/pdf-sample-analysis.md` carries the evidence.

### 3.1 Measured baseline (2026-10-23)

| Dimension | Six-month baseline | Stress ceiling | Basis |
|---|---:|---:|---|
| Registered accounts | 10,000 | 50,000 | product target |
| Visits per day | 50,000–100,000 | 100,000 | product target |
| Concurrent online | 3,000–5,000 | 5,000 | product target |
| API requests per second | 300 | 600 | derived from visits and online sessions |
| Concurrent uploads | 300 | 600 | product target |
| Upload events per month | 350,000 | 500,000 | 10k × 70% × 50; 50k × 20% × 50 |
| Active stored files (90 days) | 1,050,000 | 1,500,000 | three months of accepted uploads |
| Pages per month | 28,100,000 | 40,100,000 | 80.3 pages per file |
| Active parts at 31.7 rows/page and 20% dedup | 2,140,000,000 | 3,060,000,000 | three months of parts |
| Raw file storage (90 days) | about 2.4 TB | about 3.4 TB | 2.28 MB average |
| Replicated and derived storage | about 6.3 TB | about 8.9 TB | 2× replication + 30% derived data |
| Processing workers at 5–10 min/file, 8-hour window | 122–243 | 174–347 | calculation in §5 |
| Processing workers at 15 min/file, 8-hour window | 365 | 521 | OCR-heavy sensitivity |

The stress ceiling is not a promise that every one of the 50,000 accounts uploads
50 files in the same month. It is the volume that the components must survive
before a new sizing decision. The baseline assumes 70% of the 10,000 accounts
upload in the month; that is a conservative planning assumption, not a forecast.
The stress case assumes 20% of the 50,000 accounts upload in the month.

### 3.2 Scanned-heavy envelope (pre-sample, retained as stress)

The pre-sample envelope assumed 7.8 MB average and 100 pages per file. It is
retained for the case where scans or large files dominate. It is not the measured
baseline.

| Dimension | Six-month baseline | Stress ceiling | Basis |
|---|---:|---:|---|
| Average file size | 7.8 MB | 7.8 MB | 94% at 7 MB, 6% at 20 MB |
| Pages per file | 100 | 100 | pre-sample assumption |
| Pages per month | 35,000,000 | 50,000,000 | 100 pages per file |
| Active parts at 31.7 rows/page and 20% dedup | 2,660,000,000 | 3,800,000,000 | three months of parts |
| Raw file storage (90 days) | 8.2 TB | 11.7 TB | 7.8 MB weighted average |
| Replicated and derived storage | about 21 TB | about 30 TB | 2× replication + 30% derived data |

All other rows are those of the measured baseline. This envelope is a stress
case, not a second forecast.

## 4. Read traffic

A visit is a session, not a request. The arithmetic is:

- 100,000 visits/day = **1.16 visits/second** on average.
- At a 20× peak, that is **23 visits/second**.
- At 10 requests per visit, that is **230 requests/second** at peak.
- The planning figure is therefore **300 RPS** at design and **600 RPS** at
  stress.

The concurrent-online figure is consistent with that volume when only a fraction
of open sessions is actively requesting:

| Concurrent online | Active share | Request interval | Resulting RPS |
|---:|---:|---:|---:|
| 3,000 | 10% | 30 s | 10 |
| 3,000 | 20% | 10 s | 60 |
| 5,000 | 20% | 10 s | 100 |
| 5,000 | 50% | 10 s | 250 |

The 300–600 RPS envelope covers the table above with headroom. Search is a
fraction of those requests; the search budget remains p95 < 1 s, and the actual
search QPS is measured at the R12 load test rather than assumed here.

The Home page's six part-family counts are one indexed aggregate query over the
parts projection, not six queries (ADR-130); they are read with the page and add
one query per Home visit to the envelope above.

Read traffic is served by API replicas, the PostgreSQL system of record,
OpenSearch for the parts listing, and a CDN for public pages and images. The
price projection for a guest contains no price at all (ADR-040); this is a
response-shape rule, not a capacity exception.

## 5. Upload and processing

### 5.1 Upload ingress

The measured sample average is **2.28 MB**. The pre-sample scanned-heavy
envelope uses **7.8 MB**: 94% at 7 MB and 6% at 20 MB gives
`0.94 × 7 + 0.06 × 20 = 7.8 MB`.

At 300–600 concurrent uploads, the measured bytes in flight are 0.68–1.37 GB.
If those transfers complete in 30–60 seconds, the inbound rate is **11–46 MB/s**
(about 0.1–0.37 Gbps). In the scanned-heavy case the bytes in flight are
2.3–4.7 GB and the rate is **39–156 MB/s** (about 0.3–1.25 Gbps). The upload path
is a presigned multipart stream to SeaweedFS; the API does not buffer the file.

### 5.2 Processing arithmetic

The worker estimate uses an 8-hour processing window:

```text
files/day       = files/month ÷ 30
CPU-hours/day   = files/day × minutes/file ÷ 60
workers         = CPU-hours/day ÷ 8
```

At 350,000 files/month:

- 11,667 files/day.
- At 5 minutes/file: 972 CPU-hours/day, or **122 workers**.
- At 10 minutes/file: 1,944 CPU-hours/day, or **243 workers**.
- At 15 minutes/file: 2,917 CPU-hours/day, or **365 workers**.

At 500,000 files/month:

- 16,667 files/day.
- At 5 minutes/file: 1,389 CPU-hours/day, or **174 workers**.
- At 10 minutes/file: 2,778 CPU-hours/day, or **347 workers**.
- At 15 minutes/file: 4,167 CPU-hours/day, or **521 workers**.

The 5-minute p95 budget includes queue wait. A burst of 600 uploads cannot be
processed by a fixed 100-worker pool inside the budget if every file is a
100-page scan. The pool must autoscale, and the queue depth is the signal that
drives it.

### 5.3 Burst arithmetic

In the scanned-heavy case, a burst of 600 files at 100 pages each is 60,000
pages. At 3 seconds/page, that is 50 CPU-hours of work. A 100-worker pool needs
about 30 minutes; a 300-worker pool needs about 10 minutes. This is why the
upload path and the processing path are separate: the upload is accepted
quickly, and the user sees `processing` while the queue drains.

## 6. Quota model

### 6.1 Binding and administrator ceiling

| Quota | Binding value | Administrator ceiling | Reset or release |
|---|---:|---:|---|
| Monthly uploads per user | 50 | 500 | calendar month; deletion does not restore it |
| Active stored files per user | 300 | 1,500 | deletion or 90-day retention releases a slot |
| Lifetime total | none | none | not applicable |

The model is internally consistent:

- 50 uploads/month × 3 months = 150 active files, so the 300 active cap is a
  safety cap and is not reached by an ordinary account.
- 500 uploads/month × 3 months = 1,500 active files, so the administrator
  ceiling needs the 1,500 active ceiling.
- A 300 active default with 50/month would otherwise block a 500/month exception
  after 18 days.

### 6.2 Rules the implementation must preserve

- The monthly quota counts **upload events** in the calendar month. Deleting a
  file does not restore the monthly count; otherwise upload-and-delete would be
  an unbounded upload path.
- The active quota counts **active stored files**. A merchant delete, an
  administrator delete, or the 90-day retention job releases a slot.
- The administrator ceiling is a **per-user exception**, not a global setting.
  It is not `PlatformSetting`; ADR-067 forbids a Usage Limit in that entity.
- A quota change is audited with the administrator, the old value, the new
  value, the reason, and the timestamp.
- Lowering a quota never deletes a file. It blocks new uploads until the account
  is under the new limit.
- Raising a quota takes effect immediately.
- Quota checks are atomic. At 300–600 concurrent uploads, a read-then-write
  check without a transaction or counter can let a user exceed the limit.
- A blocked account cannot upload; blocking never deletes its files.

### 6.3 Administrator-ceiling guardrail

The 500/1,500 ceiling is an exception path. It is not a second default. The
capacity effect is additive:

- 1% of 10,000 accounts at 500/month, with the rest at 50, is 545,000
  uploads/month, about 9% above the 500,000 stress case.
- 5% at 500/month is 725,000 uploads/month, about 45% above the stress case and a
  re-sizing trigger.
- 10,000 accounts all at 500/month is 5,000,000 uploads/month, 117 TB of raw
  file storage per 90 days at the scanned-heavy 7.8 MB average, and 1,700–3,500
  workers at 5–10 minutes/file. That is outside this model.

The percentage is an operational guardrail, not a product limit. The 500/1,500
values are the product ceiling; how many exceptions are granted is a capacity
decision measured against this section.

## 7. Deletion and retention

The merchant's self-delete, the administrator's delete, and the 90-day retention
job share one cascade:

1. Withdraw the catalog's bytes.
2. Withdraw its parts.
3. Withdraw its bookmarks.
4. Withdraw its search-index entries.
5. Record the operation where the actor requires a record; every administrator
   operation is audited.

The catalog row may remain as a soft-deleted record, but the bytes, parts,
bookmarks, and index entries are gone. The active-file quota counts the
withdrawn state, not the soft-deleted row.

Consequences:

- Search contains only files from the last 90 days. A merchant who stops
  uploading disappears from search after the retention window.
- The 90-day deletion releases an active slot but does not restore the monthly
  upload count.
- The 90 days are counted from the catalog file's upload timestamp (ADR-131).
  This model already used the upload date as its conservative sizing
  assumption; the trigger is now fixed, so the sizing and the rule agree.

If the product later keeps extracted parts after deleting the original bytes,
that is a different model: file storage falls, but PostgreSQL and OpenSearch
retain the parts and the retention rule must say so. This document does not
assume that variant.

## 8. Storage and search projection

### 8.1 File storage

The raw 90-day file storage is:

```text
files/month × average file size × 3 months
```

| Scenario | Files/month | Raw 90-day storage | With 2× replication | With 30% derived |
|---|---:|---:|---:|---:|
| Measured design | 350,000 | about 2.4 TB | 4.8 TB | about 6.3 TB |
| Measured stress | 500,000 | about 3.4 TB | 6.8 TB | about 8.9 TB |
| Scanned-heavy design | 350,000 | 8.2 TB | 16.4 TB | about 21 TB |
| Scanned-heavy stress | 500,000 | 11.7 TB | 23.4 TB | about 30 TB |

The measured rows use 2.28 MB average; the scanned-heavy rows use 7.8 MB. The
derived allowance covers page images, OCR text, temporary workspace, and
index-side artefacts. It is not a second copy of the original file.

### 8.2 Parts and the search index

The sample measured 31.7 rows per page (median 33, range 21–47). At 80.3
pages/file, 350,000/500,000 files per month, and 20% deduplication:

| Rows per page | Active parts, design | Active parts, stress | Basis |
|---:|---:|---:|---|
| 10 | 675,000,000 | 964,000,000 | pre-sample row count |
| 20 | 1,350,000,000 | 1,930,000,000 | sensitivity |
| 31.7 | 2,140,000,000 | 3,060,000,000 | measured sample |
| 50 | 3,370,000,000 | 4,820,000,000 | high sensitivity |

The scanned-heavy 100 pages/file case at 31.7 rows/page gives about 2.66 billion
active parts at design and 3.80 billion at stress.

The 50,000-account figure is not a database problem by itself; 50,000 rows in
`users` is small. The parts projection is the database and search problem, and
the 2–3 billion range is accepted as the planning envelope (ADR-121). Two
consequences are binding on the physical design and are not R3's free choice:

- **`parts` is partitioned by the catalog's upload time**, so the 90-day
  retention is a partition drop rather than a row-by-row delete. In PostgreSQL a
  partitioned table's unique constraint must include the partition key, so the
  part's identity and every reference to it must accommodate the partition key.
  R3's plan chooses the mechanism; it does not choose whether to partition.
- **OpenSearch uses time-based indices with an alias.** ISM deletes a whole index
  by age; a per-catalog delete is a delete-by-query on the alias. The shard count
  is derived from the modelled index size, not guessed.

The two levers that change this projection are the cross-merchant unique-file
rate (the content-hash check rejects an identical file before processing) and
the deduplication rate. Both are unmeasured; 20% remains an assumption.

## 9. Deployment shape

This is a shape, not a quote and not a single-server specification:

| Component | Planning shape |
|---|---|
| API | 4–8 replicas, 4 vCPU / 8 GB each, stateless, behind a load balancer |
| PostgreSQL | 8–16 vCPU / 32–64 GB, SSD, primary plus replica, PgDog in front; `parts` partitioned by upload time, retention by partition drop |
| Redis | 8–16 GB for BullMQ and cache |
| OpenSearch | at least 3 data nodes, 8–16 vCPU / 32–64 GB, NVMe; time-based indices with an alias; shard count from the modelled 2–3 billion index |
| SeaweedFS | 4–6 nodes, 16 TB each, 10 Gbps, replication; 4 nodes give 64 TB raw and about 32 TB replicated, covering both the 6.3–8.9 TB measured and 21–30 TB scanned-heavy envelopes |
| Workers | 50–350 autoscaling, 2–4 vCPU / 4–8 GB each; 365–521 at the 15-minute OCR sensitivity |
| OCR | local first: a self-hosted OCR engine and table-structure extraction on the platform's own worker or GPU pool; a cloud document-AI service only after the local benchmark fails and the owner approves (ADR-122) |
| Edge | CDN for public pages and images; TLS and load balancing at the edge |
| Observability | Prometheus + Grafana; p95 request latency, search p95, processing success rate, queue depth |

The API and worker replicas scale horizontally. A single large VM is not the
design: the system needs a queue, a worker pool, a replicated database, a
multi-node search cluster, and replicated object storage.

## 10. Bottlenecks and risks

1. **Table extraction from text PDFs and scans.** A scanned Arabic parts table is
   not a text PDF; OCR alone does not preserve merged columns, rotated pages, or
   a table's row boundaries. The sample also found text PDFs whose text layer is
   corrupted, so a text layer is not a guarantee. The extraction technology is a
   register gap; R3 must choose it through the gap process and prove it on real
   pages before the model is treated as final. The local path is the default
   (ADR-122).
2. **The 5-minute p95 processing budget.** A 100-page scan at 3 seconds/page is
   already at the budget before queue wait. Autoscaling alone does not remove
   the per-file floor; parallel page processing and a fast OCR path are required.
3. **Parts volume.** The measured 31.7 rows/page gives about 2.14 billion active
   parts at design and 3.06 billion at stress, after 20% deduplication. The
   scanned-heavy 100-page case reaches 2.66–3.80 billion. The range is accepted
   (ADR-121); PostgreSQL and OpenSearch are the capacity risk, not the 50,000
   user rows.
4. **Storage growth.** The measured sample needs about 6.3–8.9 TB replicated and
   derived; the scanned-heavy envelope needs 21–30 TB. The 90-day rule caps the
   file set, but replication and derived data still multiply the originals.
5. **Administrator review.** Ten administrators cannot review 350,000–500,000
   files a month. The pipeline must process automatically and route only
   exceptions to a human.
6. **The 500/1,500 exception.** A small number of exceptions is affordable; a
   broad grant changes the stress case and is a re-sizing event.
7. **Text-layer quality.** Eight of the 18 text PDFs in the sample carry
   corrupted characters or unreadable headers. A quality gate is required before
   extraction, with a fallback to another extractor or OCR.

## 11. Verification

### 11.1 Before R3 commits to extraction

Measure 20–50 real pages from real supplier files:

- Text-layer quality and encoding, including the share of expected Arabic that
  survives extraction.
- Arabic text accuracy.
- Table structure and merged-column accuracy.
- Per-column precision and recall for the six canonical columns and the supplier.
- Time per 100 pages on the local path.
- Cost per 1,000 pages on the local path, and the cloud comparison only if a
  cloud path is later approved.
- Data terms and retention of any cloud OCR provider, if one is later approved.

The sample must include Excel, Word, text PDF, and scanned PDF. The local path is
measured first; a cloud service is evaluated only if the local path fails the
gate (ADR-122). The result feeds R3's extraction decision and the next revision
of this model.

### 11.2 At R12's pre-release load test

The load test measures the model, not a smaller substitute:

- 100,000 visits/day and 5,000 concurrent online sessions.
- 600 concurrent uploads.
- 50,000 registered accounts.
- 2–3 billion parts present in the corpus, so the search p95 is measured at the
  modelled index size, not on an empty or small index.
- 500,000 uploads in the modelled month, or a scaled equivalent with the same
  arrival shape.
- p95 request latency, search p95, processing p95, error rate, queue depth, and
  storage growth.

### 11.3 Re-run triggers

Re-run the model when any of these changes:

- average file size or the 20 MB share;
- pages per file;
- rows per page;
- the cross-merchant unique-file rate;
- the deduplication rate;
- OCR coverage (all-scanned versus mixed);
- the share of accounts that upload in a month;
- the share of accounts granted 500/1,500;
- the retention trigger or the deletion cascade;
- the constitution's Usage Limits.

**Review date**: 2026-11-23. The six-month horizon itself is reviewed at R12;
this document defines no other horizon.

## 12. Open assumptions

These are assumptions, not final measurements:

- The first sample (19 files, 2026-10-23) gives 2.28 MB average, 80.3 pages per
  file, 31.7 rows per page, and 5.3% scanned files. It is a preliminary
  measurement, not a population estimate.
- The scanned-heavy envelope retains 7.8 MB average and 100 pages per file as a
  stress case; it is not the measured baseline.
- 20% deduplication remains an assumption; it is one of the two levers that
  change the parts projection (ADR-121).
- The cross-merchant unique-file rate is unmeasured; the content-hash check may
  reduce the accepted-upload volume well below the 350,000/500,000 model.
- 70% of the 10,000 accounts upload in the design month.
- 20% of the 50,000 accounts upload in the stress month.
- The share of text PDFs whose text layer is corrupted, and therefore needs an
  alternate extractor or OCR, is not yet measured beyond the sample.
- 90 days counted from the catalog file's upload timestamp, as both the sizing
  assumption and the retention trigger (ADR-131).
- No OCR technology is selected; OCR runs locally first, and a cloud service is
  a later approved option (ADR-122).
- The per-user quota overrides are optional fields on `User` (ADR-118); R2
  enforces them and R13 provides the administrator surface.

## 13. References

- `.specify/memory/constitution.md` — Usage Limits, Performance Budgets and
  Verification, Principle X, Technology Standards.
- `docs/architecture.md` — data flow, modules, worker pipeline.
- `docs/domain-model.md` — entities, invariants, and the current quota
  invariant.
- `docs/pdf-sample-analysis.md` — the 2026-10-23 sample evidence and its limits.
- `docs/DECISIONS.md` — the decision register's index; the records named here
  are ADR-067, ADR-117, ADR-118, ADR-119, ADR-121, ADR-122.
- `ROADMAP.md` — R2, R3, R12, R13, R15, R16.
