# Decisions — Wafar

This file is the decision register's index and reading protocol. It is named in
the constitution's References and required by Documentation; the records it
points to live in `docs/decisions/volume-NN.md`, one contiguous ADR range per
volume. The index below is the only entry point and the only authority for the
live `ADR-001 … ADR-0NN` range string.

**Record duties (Documentation rule).** Every record in the register names the
directory that owns the decision and the feature that owns the work, per the
Documentation rule. Most were made by a constitutional amendment, but not all:
ADR-001 to ADR-007 were made during repository bootstrap on 2026-10-01, ADR-009
and ADR-011 recorded the design system's own decisions and the mirrors'
encoding, ADR-012 to ADR-013 were design-system and workflow decisions, and
ADR-015 onward were ratified by the repository owner. The
owning feature is one of "none yet — repository bootstrap (pre-feature record)",
"none — governance decision; ratified by the repository owner", or the
identifier of the slice that first implements the decision. The bootstrap-era
records state the reaffirmation duty explicitly: the first feature whose plan
depends on the record MUST name it in that plan's Constitution Check, and from
then on the record has a feature owner.

A record is annotated when a later decision changes what it says, and corrected
when the record's own claim was wrong. Rewriting a ratified decision's substance
is not done; ADR-015 states that rule and this register follows it.

**Reading protocol (ADR-071, ADR-125).** The register is large and grows with
every amendment, so a reader — a person or an agent — MUST NOT read it end to
end. Read this index, then only the single volume that holds the record in hand.
The index's last row is the current ADR number, and it is the single authority
for the live `ADR-001 … ADR-0NN` range string that the governance documents
carry: `governance-drift-check.mjs` compares every live range string against
that last row, so a document whose range disagrees with the index is corrected
from the index rather than edited in its own words.

**Append rule (ADR-125).** A new record is appended to the last volume, and its
index row points to the volume that holds it. The binding rule — when a volume
is closed, and how large a volume or the index may grow — is stated once in the
constitution's Documentation section and enforced by `governance-drift-check.mjs`.

## Index

| ADR | Subject | Ratified | Constitution version |
|-----|---------|----------|---------------------|
| [ADR-001](decisions/volume-01.md#adr-001--monorepo-with-a-modular-monolith-api) | Monorepo with a Modular Monolith API | 2026-10-01 | — |
| [ADR-002](decisions/volume-01.md#adr-002--hono-for-the-api-framework) | Hono for the API framework | 2026-10-01 | — |
| [ADR-003](decisions/volume-01.md#adr-003--opensearch-for-the-search-engine) | OpenSearch for the search engine | 2026-10-01 | — |
| [ADR-004](decisions/volume-01.md#adr-004--better-auth-without-the-scim-and-sso-modules) | better-auth without `scim` and `sso` | 2026-10-01 | — |
| [ADR-005](decisions/volume-01.md#adr-005--seaweedfs-for-object-storage) | SeaweedFS for object storage | 2026-10-01 | — |
| [ADR-006](decisions/volume-01.md#adr-006--dark-mode-by-default) | Dark mode by default | 2026-10-01 | — |
| [ADR-007](decisions/volume-01.md#adr-007--project-level-knowledge-lives-outside-the-feature-sequence) | Project-level knowledge lives outside the feature sequence | 2026-10-01 | — |
| [ADR-008](decisions/volume-01.md#adr-008--project-level-registers-live-in-the-constitution-the-detail-stays-in-the-sources) | Registers live in the constitution; the detail stays in the sources | 2026-10-02 | 2.7.0 |
| [ADR-009](decisions/volume-01.md#adr-009--the-design-systems-own-decisions-recorded-out-of-its-source-comments) | The design system's own decisions, recorded out of its source comments | 2026-10-02 | 2.7.0 |
| [ADR-010](decisions/volume-01.md#adr-010--constitution-271-the-amendments-durable-record-and-the-review-fix-set) | The amendment's durable record, and the review-fix set | 2026-10-02 | 2.7.1 |
| [ADR-011](decisions/volume-01.md#adr-011--mirror-files-confirmed-as-valid-utf-8) | Mirror files confirmed as valid UTF-8 | 2026-10-02 | — |
| [ADR-012](decisions/volume-01.md#adr-012--design-system-101-font-stack-and-arabic-letter-spacing) | Design system 1.0.1: font stack and Arabic letter-spacing | 2026-10-02 | — |
| [ADR-013](decisions/volume-01.md#adr-013--converge-stays-a-separate-command-not-a-workflow-step) | Converge stays a separate command, not a workflow step | 2026-10-02 | — |
| [ADR-014](decisions/volume-01.md#adr-014--constitution-280-artifact-traceability-and-product-fact-clarifications) | Artifact traceability and product fact clarifications | 2026-10-02 | 2.8.0 |
| [ADR-015](decisions/volume-01.md#adr-015--the-slice-order-becomes-fifteen-slices-and-a-slice-identifier-equals-its-specification-number) | Fifteen slices; a slice identifier equals its specification number | 2026-10-03 | 2.9.0 |
| [ADR-016](decisions/volume-01.md#adr-016--the-icon-set-and-the-shell-belong-to-the-foundation-duties-of-r1) | The icon set and the shell belong to R1's foundation duties | 2026-10-03 | 2.9.0 |
| [ADR-017](decisions/volume-01.md#adr-017--shell-scope-and-the-sidebar-conflict) | Shell scope and the sidebar conflict | 2026-10-03 | 2.9.2 |
| [ADR-018](decisions/volume-01.md#adr-018--structure-registers-closed-the-gaps-left-by-principle-x-and-adr-017) | Structure registers closed the gaps left by Principle X and ADR-017 | 2026-10-03 | 2.9.2 |
| [ADR-019](decisions/volume-01.md#adr-019--one-domain-model-one-authority-and-the-register-defect-it-closes) | One domain model, one authority, and the register defect it closes | 2026-10-03 | 2.10.0 |
| [ADR-020](decisions/volume-01.md#adr-020--constitution-register-restored-to-its-own-rules) | Constitution register restored to its own rules | 2026-10-03 | 2.10.1 |
| [ADR-021](decisions/volume-01.md#adr-021--spec-kit-110-and-node-22-lts-pin) | Spec Kit 1.1.0 and Node 22 LTS pin | 2026-10-03 | 2.10.1 (unchanged) |
| [ADR-022](decisions/volume-01.md#adr-022--constitution-2102-audit-fixes) | Constitution 2.10.2 (audit fixes) | 2026-10-03 | 2.10.2 |
| [ADR-023](decisions/volume-01.md#adr-023--constitution-2110-security-hardening-anti-spam-static-design-enforcement-ops-controls) | Constitution 2.11.0: security hardening, anti-spam, static design enforcement, ops controls | 2026-10-03 | 2.11.0 |
| [ADR-024](decisions/volume-01.md#adr-024--constitution-2111-stylelint-named-in-technology-standards) | Constitution 2.11.1: Stylelint named in Technology Standards | 2026-10-03 | 2.11.1 |
| [ADR-025](decisions/volume-01.md#adr-025--the-segoe-ui-fallback-leaves-the-tajawal-font-stack) | The Segoe UI fallback leaves the Tajawal font stack | 2026-10-03 | 2.11.1 (unchanged) |
| [ADR-026](decisions/volume-01.md#adr-026--git-branching-workflow-extension-adopted-mandatory-feature-branches) | Git Branching Workflow Extension adopted; mandatory feature branches | 2026-10-03 | 2.11.1 (unchanged) |
| [ADR-027](decisions/volume-01.md#adr-027--audit-fix-set-adr-stamps-workflow-version-hook-state-cline-registration-css-token) | Audit fix set: ADR stamps, workflow version, hook state, cline registration, CSS token | 2026-10-03 | 2.11.1 (unchanged) |
| [ADR-028](decisions/volume-01.md#adr-028--constitution-2120-quota-window-and-contact-message-path) | Constitution 2.12.0: quota window, contact-message path | 2026-10-03 | 2.12.0 |
| [ADR-029](decisions/volume-01.md#adr-029--roadmap-dependency-and-ownership-corrections) | Roadmap dependency and ownership corrections | 2026-10-03 | 2.12.0 |
| [ADR-030](decisions/volume-02.md#adr-030--constitution-2130-phone-only-authentication) | Constitution 2.13.0: phone-only authentication | 2026-10-03 | 2.13.0 |
| [ADR-031](decisions/volume-02.md#adr-031--roadmap-audit-fix-set) | Roadmap audit fix set | 2026-10-04 | 2.13.0 (unchanged) |
| [ADR-032](decisions/volume-02.md#adr-032--roadmap-second-audit-fix-set) | Roadmap second audit fix set | 2026-10-04 | 2.13.0 (unchanged) |
| [ADR-033](decisions/volume-02.md#adr-033--audit-fix-set-full-name-cascade-ownership-entry-point-dependency-budget-analyze-wording-mirror-claims-cleanup) | Audit fix set: full name, cascade ownership, entry point, dependency budget, analyze wording, mirror-claims cleanup | 2026-10-04 | 2.14.0 |
| [ADR-034](decisions/volume-02.md#adr-034--constitution-2150-metrics-stack-dependency-scanner-staging-anonymiser-and-the-optional-web-server-directory) | Constitution 2.15.0: metrics stack, dependency scanner, staging anonymiser, optional web-server dir | 2026-10-04 | 2.15.0 |
| [ADR-035](decisions/volume-02.md#adr-035--constitution-2151-encoding-repair-and-utf-8-verification-note) | Constitution 2.15.1: encoding repair and UTF-8 verification note | 2026-10-04 | 2.15.1 |
| [ADR-036](decisions/volume-02.md#adr-036--constitution-2152-audit-fix-set--quota-invariant-breakpoint-table-wording-mirror-omissions-roadmap-fact-rows) | Audit fix set: quota invariant, breakpoint table wording, mirror omissions, roadmap fact rows | 2026-10-04 | 2.15.2 |
| [ADR-037](decisions/volume-02.md#adr-037--constitution-2160-design-values-carve-out-p95-budgets-sidebar-icon-rail-two-cmv-rows) | Constitution 2.16.0: design-values carve-out, p95 budgets, sidebar icon rail, two CMV rows | 2026-10-04 | 2.16.0 |
| [ADR-038](decisions/volume-02.md#adr-038--constitution-2170-register-gaps-clamavlighthouse-ci-role-split-and-defined-terms) | Constitution 2.17.0: register gaps, ClamAV/Lighthouse CI, role split, reprocess/trade-name/reports/cart-name terms | 2026-10-04 | 2.17.0 |
| [ADR-039](decisions/volume-02.md#adr-039--repository-line-ending-and-encoding-policy-recorded-mirror-stops-restating-rules-fallback-templates-labelled) | Repository line-ending and encoding policy recorded; mirror stops restating rules; fallback templates labelled | 2026-10-04 | — (unchanged) |
| [ADR-040](decisions/volume-02.md#adr-040--the-canonical-columns-of-a-part-its-price-and-the-original-number) | The canonical columns of a part: its price, and the original number | 2026-10-05 | 2.18.0 |
| [ADR-041](decisions/volume-02.md#adr-041--registration-is-libya-only-and-the-dial-code-selector-is-removed) | Registration is Libya only, and the dial-code selector is removed | 2026-10-05 | 2.18.0 |
| [ADR-042](decisions/volume-02.md#adr-042--no-emoji-in-user-facing-text-and-an-open-source-svg-icon-set) | No emoji in user-facing text, and an open-source SVG icon set | 2026-10-05 | 2.18.0 |
| [ADR-043](decisions/volume-02.md#adr-043--supplier-names-are-normalised-and-never-merged-by-normalisation) | Supplier names are normalised, and never merged by normalisation | 2026-10-05 | 2.18.0 |
| [ADR-044](decisions/volume-02.md#adr-044--constitution-2181-part-name-year-ranges-stay-in-the-name) | Constitution 2.18.1: part-name year ranges stay in the name | 2026-10-05 | 2.18.1 |
| [ADR-045](decisions/volume-02.md#adr-045--constitution-2182-cart-label-diacritics-unused-token-note-price-shape) | Constitution 2.18.2: cart label, diacritics, unused-token note, price shape | 2026-10-05 | 2.18.2 |
| [ADR-046](decisions/volume-02.md#adr-046--constitution-2183-notification-admin-reply-unused-shadow-ladder-note) | Constitution 2.18.3: notification admin-reply, unused shadow ladder note | 2026-10-05 | 2.18.3 |
| [ADR-047](decisions/volume-02.md#adr-047--audit-fix-set-commit-state-manifest-hashes-cart-label-filter-set-stamp-sites) | Audit fix set: commit state, manifest hashes, cart label, filter set, stamp sites | 2026-10-05 | 2.18.4 |
| [ADR-048](decisions/volume-02.md#adr-048--cline-integration-retired-constitution-2185-bom-repair-mirror-label-completion) | Cline integration retired; Constitution 2.18.5; BOM repair; mirror label completion | 2026-10-05 | 2.18.5 |
| [ADR-049](decisions/volume-02.md#adr-049--constitution-2187-consolidate-the-unrecorded-2186-and-2187-amendments-and-repair-the-registry-drift-they-exposed) | Constitution 2.18.7: consolidate the unrecorded 2.18.6 and 2.18.7 amendments, and repair the registry drift they exposed | 2026-10-05 | 2.18.7 |
| [ADR-050](decisions/volume-03.md#adr-050--constitution-2188-audit-fix-set--the-stamp-set-committed-and-the-registry-claims-that-failed-verification) | Constitution 2.18.8: audit fix set — the stamp set committed, and the registry claims that failed verification | 2026-10-05 | 2.18.8 |
| [ADR-051](decisions/volume-03.md#adr-051--a-tenant-is-a-merchant-account) | A tenant is a merchant account | 2026-10-05 | 2.18.8 |
| [ADR-052](decisions/volume-03.md#adr-052--the-two-granted-dependency-exceptions-are-recorded-in-the-exception-register) | The two granted dependency exceptions are recorded in the exception register | 2026-10-05 | 2.18.8 |
| [ADR-053](decisions/volume-03.md#adr-053--constitution-2189-the-design-system-enforcement-scope-the-motion-scale-the-scoping-contradiction-and-the-register-counts-that-failed-verification) | Constitution 2.18.9: enforcement scope, motion scale, scoping contradiction, register counts | 2026-10-05 | 2.18.9 |
| [ADR-054](decisions/volume-03.md#adr-054--constitution-2190-the-register-names-its-four-gates-and-the-amendment-procedure-names-its-own-stamp-sites) | Constitution 2.19.0: the register names its four gates, and the amendment procedure names its own stamp sites | 2026-10-05 | 2.19.0 |
| [ADR-055](decisions/volume-03.md#adr-055--audit-fix-set-range-string-drift-a-stale-template-hash-an-assess-hook-conflict-and-the-mirror-sync-that-was-left-unrecorded) | Audit fix set: range-string drift, a stale template hash, an assess hook conflict, and the mirror sync that was left unrecorded | 2026-10-06 | 2.19.0 |
| [ADR-056](decisions/volume-03.md#adr-056--constitution-2191-section-name-references-glossary-terms-and-the-register-gap-classification) | Constitution 2.19.1: section-name references, glossary terms, and the register-gap classification | 2026-10-06 | 2.19.1 |
| [ADR-057](decisions/volume-03.md#adr-057--constitution-2192-the-audit-findings-re-verified-and-the-design-systems-token-rule-enforced) | Constitution 2.19.2: the audit findings re-verified, and the design system's token rule enforced | 2026-10-06 | 2.19.2 |
| [ADR-058](decisions/volume-03.md#adr-058--constitution-2200-the-writing-direction-rules-value-form-two-register-levels-and-the-decision-records-that-failed-verification) | Constitution 2.20.0: the writing-direction rule's value form, two register levels, and the decision records that failed verification | 2026-10-06 | 2.20.0 |
| [ADR-059](decisions/volume-03.md#adr-059--constitution-2210-two-tools-the-rules-already-required-and-the-mirror-claims-that-contradicted-the-register) | Constitution 2.21.0: two tools the rules already required, and the mirror claims that contradicted the register | 2026-10-06 | 2.21.0 |
| [ADR-060](decisions/volume-03.md#adr-060--constitution-2220-the-design-systems-register-against-its-own-file-the-files-binding-rules-and-the-citations-that-named-the-wrong-section) | Constitution 2.22.0: the design system's register against its own file, the file's binding rules, and the citations that named the wrong section | 2026-10-06 | 2.22.0 |
| [ADR-061](decisions/volume-04.md#adr-061--the-in-flight-clarifications-recorded-and-the-reserved-decision-the-one-phrasing-pre-empted) | The in-flight clarifications recorded, and the reserved decision the one phrasing pre-empted | 2026-10-06 | 2.22.0 (unchanged) |
| [ADR-062](decisions/volume-04.md#adr-062--constitution-2221-wording-only-reference-precision-and-stamp-sync) | Constitution 2.22.1: wording-only reference precision and stamp sync | 2026-10-06 | 2.22.1 |
| [ADR-063](decisions/volume-04.md#adr-063--constitution-2230-the-form-metrics-register-corrected-against-its-source-and-the-amendment-closed) | Constitution 2.23.0: the form-metrics register corrected against its source, and the amendment closed | 2026-10-07 | 2.23.0 |
| [ADR-064](decisions/volume-04.md#adr-064--constitution-2231-and-wafarsinglecss-121-the-audit-fix-set) | Constitution 2.23.1 and wafar.single.css 1.2.1: the audit fix set | 2026-10-07 | 2.23.1 |
| [ADR-065](decisions/volume-04.md#adr-065--css-header-workflow-hint-and-r2-scope-defect-fix-set) | CSS header, workflow hint, and R2 scope defect fix set | 2026-10-07 | 2.23.1 (unchanged) |
| [ADR-066](decisions/volume-04.md#adr-066--constitution-2240-the-version-lives-in-two-sources-and-the-opensearch-client-owner) | Constitution 2.24.0: the version lives in two sources, and the OpenSearch client owner | 2026-10-07 | 2.24.0 |
| [ADR-067](decisions/volume-04.md#adr-067--constitution-2250-the-administrator-is-a-role-userstatus-and-two-new-entities) | Constitution 2.25.0: the administrator is a role, `User.status`, and two new entities | 2026-10-07 | 2.25.0 |
| [ADR-068](decisions/volume-04.md#adr-068--integration-topology-settled-and-the-constitution-command-aligned-to-upstream) | Integration topology settled, and the constitution command aligned to upstream | 2026-10-07 | 2.25.0 (unchanged) |
| [ADR-069](decisions/volume-04.md#adr-069--cross-artifact-consistency-fix-set) | Cross-artifact consistency fix set | 2026-10-08 | 2.25.0 (unchanged) |
| [ADR-070](decisions/volume-04.md#adr-070--part-tenancy-and-a-clarification-set) | Part tenancy, and a clarification set | 2026-10-08 | 2.26.0 |
| [ADR-071](decisions/volume-04.md#adr-071--cross-artifact-consistency-and-tooling-fix-set) | Cross-artifact consistency and tooling fix set | 2026-10-08 | 2.26.0 (unchanged) |
| [ADR-072](decisions/volume-04.md#adr-072--workflow-execution-defects-and-css-standard-conformance) | Workflow execution defects and CSS standard conformance | 2026-10-08 | 2.27.0 |
| [ADR-073](decisions/volume-04.md#adr-073--duplicate-storage-semantics-slice-component-obligations-and-mirror-precision) | Duplicate-storage semantics, slice component obligations, and mirror precision | 2026-10-08 | 2.27.1 |
| [ADR-074](decisions/volume-05.md#adr-074--deep-audit-fix-set-the-exception-registers-classification-the-sticky-headers-owner-module-ownership-and-the-constitutions-own-precision-defects) | Deep-audit fix set: the exception register's classification, the sticky header's owner, module ownership, and the constitution's own precision defects | 2026-10-08 | 2.27.2 |
| [ADR-075](decisions/volume-05.md#adr-075--constitution-2280-the-constitutions-reading-protocol-structural-count-checks-and-mirror-hygiene) | Constitution 2.28.0: the constitution's reading protocol, structural-count checks, and mirror hygiene | 2026-10-08 | 2.28.0 |
| [ADR-076](decisions/volume-05.md#adr-076--roadmap-module-ownership-counts-corrected) | Roadmap module-ownership counts corrected | 2026-10-08 | 2.28.0 (unchanged) |
| [ADR-077](decisions/volume-05.md#adr-077--admin-module-creation-and-the-platformsetting-read-surface) | Admin-module creation and the PlatformSetting read surface | 2026-10-08 | 2.28.0 (unchanged) |
| [ADR-078](decisions/volume-05.md#adr-078--superseded-owner-assignments-annotated-and-the-platformsetting-duty-corrected) | Superseded owner assignments annotated, and the PlatformSetting duty corrected | 2026-10-08 | 2.28.0 (unchanged) |
| [ADR-079](decisions/volume-05.md#adr-079--constitution-2281-the-drift-checks-four-descriptions-aligned) | Constitution 2.28.1: the drift check's four descriptions aligned | 2026-10-08 | 2.28.1 |
| [ADR-080](decisions/volume-05.md#adr-080--the-drift-checks-structural-count-coverage-completed) | The drift check's structural-count coverage completed | 2026-10-08 | 2.28.1 (unchanged) |
| [ADR-081](decisions/volume-05.md#adr-081--spec-kit-cli-upgraded-to-112-the-scaffold-pin-annotated) | Spec Kit CLI upgraded to 1.1.2; the scaffold pin annotated | 2026-10-08 | 2.28.1 (unchanged) |
| [ADR-082](decisions/volume-05.md#adr-082--the-adr-indexs-anchor-integrity-checked-and-adr-064s-anchor-repaired) | The ADR index's anchor integrity checked, and ADR-064's anchor repaired | 2026-10-08 | 2.28.2 |
| [ADR-083](decisions/volume-05.md#adr-083--every-adr-reference-resolved-against-the-index) | Every ADR reference resolved against the index | 2026-10-08 | 2.28.3 |
| [ADR-084](decisions/volume-05.md#adr-084--the-drift-checks-adr-citations-unified) | The drift check's ADR citations unified | 2026-10-08 | 2.28.4 |
| [ADR-085](decisions/volume-05.md#adr-085--roadmap-slice-description-precision-fix-set) | Roadmap slice-description precision fix set | 2026-10-08 | 2.28.4 (unchanged) |
| [ADR-086](decisions/volume-05.md#adr-086--deep-audit-fix-set-licensing-ownership-drift-check-coverage-and-tooling-pins) | Deep-audit fix set: licensing ownership, drift-check coverage, and tooling pins | 2026-10-09 | 2.28.5 |
| [ADR-087](decisions/volume-05.md#adr-087--the-projects-licence-proprietary-all-rights-reserved) | The project's licence: proprietary, all rights reserved | 2026-10-09 | 2.28.5 (unchanged) |
| [ADR-088](decisions/volume-05.md#adr-088--governance-debt-status-and-the-integration-topology-check) | Governance-debt status, and the integration-topology check | 2026-10-09 | 2.28.6 |
| [ADR-089](decisions/volume-06.md#adr-089--roadmap-defect-table-precision-fix-set) | Roadmap defect-table precision fix set | 2026-10-09 | 2.28.6 (unchanged) |
| [ADR-090](decisions/volume-06.md#adr-090--the-documentation-rule-reaches-technical-decisions) | The Documentation rule reaches technical decisions | 2026-10-09 | 2.29.0 |
| [ADR-091](decisions/volume-06.md#adr-091--the-stamp-site-list-stays-in-the-constitution) | The stamp-site list stays in the constitution | 2026-10-09 | 2.29.0 (unchanged) |
| [ADR-092](decisions/volume-06.md#adr-092--the-integration-topology-gate-made-unconditional) | The integration-topology gate made unconditional | 2026-10-10 | 2.29.1 |
| [ADR-093](decisions/volume-06.md#adr-093--remove-the-custom-design-system-and-establish-the-ui-foundation) | Remove the custom design system and establish the UI foundation | 2026-10-20 | 3.0.0 |
| [ADR-094](decisions/volume-06.md#adr-094--guest-header-controls-and-the-administrator-shell) | Guest header controls and the administrator shell | 2026-10-20 | 3.1.0 |
| [ADR-095](decisions/volume-06.md#adr-095--make-opencode-the-default-integration-keep-codebuddy-installed) | Make opencode the default integration; keep codebuddy installed | 2026-10-20 | 3.1.0 (unchanged) |
| [ADR-096](decisions/volume-06.md#adr-096--the-r1-pre-planning-fix-set-the-cmv-values-the-shells-link-surface-the-sidebar-list-and-the-spec-scan) | The R1 pre-planning fix set: the CMV values, the shell's link surface, the sidebar list, and the spec scan | 2026-10-20 | 3.2.0 |
| [ADR-097](decisions/volume-06.md#adr-097--the-wafar-ui-layer-and-the-nuxt-4-app-layout) | The Wafar UI layer and the Nuxt 4 app layout | 2026-10-21 | 3.3.0 |
| [ADR-098](decisions/volume-06.md#adr-098--the-wafar-visual-foundation-iconpark-ibm-plex-sans-arabic-light-default-and-the-marine-palette) | The Wafar visual foundation: IconPark, IBM Plex Sans Arabic, light default, and the marine palette | 2026-10-21 | 3.3.0 |
| [ADR-099](decisions/volume-06.md#adr-099--shared-shell-header-and-the-account-menu) | Shared-shell header and the account menu | 2026-10-21 | 3.4.0 |
| [ADR-100](decisions/volume-06.md#adr-100--the-account-menus-destinations-and-the-frames-boundaries) | The account menu's destinations and the frame's boundaries | 2026-10-21 | 3.5.0 |
| [ADR-101](decisions/volume-06.md#adr-101--the-account-menus-behaviour-and-the-appearances-ownership) | The account menu's behaviour and the appearance's ownership | 2026-10-21 | 3.5.0 (unchanged) |
| [ADR-102](decisions/volume-06.md#adr-102--the-headers-theme-switch-and-the-notifications-bell) | The header's theme switch and the notifications bell | 2026-10-21 | 3.6.0 |
| [ADR-103](decisions/volume-06.md#adr-103--the-amendment-procedures-version-sources-and-the-index-column-the-check-verifies) | The amendment procedure's version sources, and the index column the check verifies | 2026-10-21 | 3.6.1 |
| [ADR-104](decisions/volume-06.md#adr-104--the-audit-fix-set-the-governance-wording-the-mirror-corrections-and-the-r1-concentration) | The audit fix set: the governance wording, the mirror corrections, and the R1 concentration | 2026-10-21 | 3.6.2 |
| [ADR-105](decisions/volume-07.md#adr-105--the-second-audit-fix-set-the-copied-adr-lists-the-r1-register-amendment-and-four-new-check-coverage-rules) | The second audit fix set: the copied ADR lists, the R1 register amendment, and four new check-coverage rules | 2026-10-21 | 3.7.0 |
| [ADR-106](decisions/volume-07.md#adr-106--the-third-audit-fix-set-the-administrator-reply-the-citation-precision-and-the-specification-identifier-check) | The third audit fix set: the administrator reply, the citation precision, and the specification identifier check | 2026-10-22 | 3.7.1 |
| [ADR-107](decisions/volume-07.md#adr-107--the-session-activity-the-policy-messages-the-city-names-the-code-step-and-the-submit-guard) | The session activity, the policy messages, the city names, the code step, and the submit guard | 2026-10-22 | 3.7.1 |
| [ADR-108](decisions/volume-07.md#adr-108--the-record-corrections-the-closed-follow-ups-and-the-misnamed-annotation) | The record corrections: the closed follow-ups and the misnamed annotation | 2026-10-22 | 3.7.1 (unchanged) |
| [ADR-109](decisions/volume-07.md#adr-109--the-slice-corrections-the-delete-cascade-the-content-safety-owner-and-the-notification-source) | The slice corrections: the delete cascade, the content-safety owner, and the notification source | 2026-10-22 | 3.7.1 (unchanged) |
| [ADR-110](decisions/volume-07.md#adr-110--the-twenty-seventh-page-the-administrator-applications-login) | The twenty-seventh page: the administrator application's login | 2026-10-22 | 3.8.0 |
| [ADR-111](decisions/volume-07.md#adr-111--the-recovery-flows-verified-state-and-the-bare-pages-state-announcements) | The recovery flow's verified state, and the bare pages' state announcements | 2026-10-22 | 3.8.0 |
| [ADR-112](decisions/volume-07.md#adr-112--the-code-steps-fields-the-administrators-first-sign-in-the-refusals-work-the-ending-of-a-pending-request-and-the-coverage-targets-scope) | The code step's fields, the administrator's first sign-in, the refusal's work, the ending of a pending request, and the coverage target's scope | 2026-10-22 | 3.8.0 (unchanged) |
| [ADR-113](decisions/volume-07.md#adr-113--the-recovery-code-steps-fields-the-restricted-administrators-sign-out-and-the-code-steps-controls) | The recovery code step's fields, the restricted administrator's sign-out, and the code step's controls | 2026-10-22 | 3.8.0 (unchanged) |
| [ADR-114](decisions/volume-07.md#adr-114--the-forced-first-changes-password-the-pending-requests-password-refusal-precedence-and-a-failed-re-request) | The forced first change's password, the pending request's password, refusal precedence, and a failed re-request | 2026-10-22 | 3.8.0 (unchanged) |
| [ADR-115](decisions/volume-07.md#adr-115--the-ended-session-state-the-acceptance-boundary-the-counted-code-the-replaced-verification-and-the-forced-change) | The ended-session state, the acceptance boundary, the counted code, the replaced verification, and the forced change | 2026-10-22 | 3.8.0 (unchanged) |
| [ADR-116](decisions/volume-07.md#adr-116--the-ui-layer-path-authority-and-the-register-gap-exception) | The UI-layer path authority and the register-gap exception | 2026-10-22 | 3.9.0 |
| [ADR-117](decisions/volume-07.md#adr-117--the-capacity-envelope-and-the-upload-quota-model) | The capacity envelope and the upload-quota model | 2026-10-23 | 3.9.0 (unchanged) |
| [ADR-118](decisions/volume-08.md#adr-118--the-upload-quota-amendment-50300-no-lifetime-total-and-the-administrator-ceiling) | The upload-quota amendment: 50/300, no lifetime total, and the administrator ceiling | 2026-10-23 | 4.0.0 |
| [ADR-119](decisions/volume-08.md#adr-119--the-first-pdf-sample-calibration-and-the-two-scenario-capacity-model) | The first PDF sample calibration and the two-scenario capacity model | 2026-10-23 | 4.0.0 (unchanged) |
| [ADR-120](decisions/volume-08.md#adr-120--the-two-price-column-one-price-cell-two-printed-amounts-and-the-primary-price) | The two-price column: one price cell, two printed amounts, and the primary price | 2026-10-24 | 4.1.0 |
| [ADR-121](decisions/volume-08.md#adr-121--the-accepted-parts-envelope-and-the-partitioning-constraint) | The accepted parts envelope and the partitioning constraint | 2026-10-24 | 4.1.0 (unchanged) |
| [ADR-122](decisions/volume-08.md#adr-122--local-first-ocr-and-the-extraction-evidence-gap) | Local-first OCR and the extraction evidence gap | 2026-10-24 | 4.1.0 (unchanged) |
| [ADR-123](decisions/volume-08.md#adr-123--the-420-audit-fix-set-references-the-exception-register-and-four-document-corrections) | The 4.2.0 audit fix set: References, the exception register, and four document corrections | 2026-10-24 | 4.2.0 |
| [ADR-124](decisions/volume-08.md#adr-124--the-blocked-recovery-confirmation-the-replacement-codes-full-period-the-single-security-notice-and-the-journey-criterias-delivery-boundary) | The blocked recovery confirmation, the replacement code's full period, the single security notice, and the journey criteria's delivery boundary | 2026-10-24 | 4.2.0 (unchanged) |
| [ADR-125](decisions/volume-08.md#adr-125--the-decision-register-split-into-an-index-and-eight-volumes) | The decision register split into an index and eight volumes | 2026-10-24 | 5.0.0 |
| [ADR-126](decisions/volume-08.md#adr-126--the-upload-catalog-page-the-twenty-eighth-page-and-the-ninth-sidebar-destination) | The Upload Catalog page: the twenty-eighth page and the ninth sidebar destination | 2026-10-25 | 5.1.0 |
| [ADR-127](decisions/volume-08.md#adr-127--the-frames-fourth-surface-the-narrow-screen-bottom-navigation-bar) | The frame's fourth surface: the narrow-screen bottom navigation bar | 2026-10-27 | 6.0.0 |
| [ADR-128](decisions/volume-08.md#adr-128--the-precision-design-contract-palette-type-shape-density-and-rendering-rules) | The Precision design contract: palette, type, shape, density, and rendering rules | 2026-10-27 | 6.0.0 |
| [ADR-129](decisions/volume-08.md#adr-129--the-design-conformance-gate-and-the-baseline-chain) | The design conformance gate and the baseline chain | 2026-10-27 | 6.0.0 |
| [ADR-130](decisions/volume-08.md#adr-130--part-families-and-the-home-category-cards) | Part families and the Home category cards | 2026-10-27 | 6.1.0 |
| [ADR-131](decisions/volume-08.md#adr-131--the-90-day-period-counted-from-the-upload) | The 90-day period counted from the upload | 2026-10-27 | 6.1.0 |
| [ADR-132](decisions/volume-08.md#adr-132--the-shell-and-appearance-scroll-hide-colour-icons-and-the-system-default) | The shell and appearance: scroll-hide, colour icons, and the system default | 2026-10-27 | 6.1.0 |
| [ADR-133](decisions/volume-08.md#adr-133--the-design-evidence-registered-docsdesign-in-references-and-adr-128129-in-principle-ix) | The design evidence registered: `docs/design` in References and ADR-128/129 in Principle IX | 2026-10-28 | 6.2.0 |
| [ADR-134](decisions/volume-08.md#adr-134--the-slice-map-and-the-roadmap-reach-the-commands-that-need-them) | The slice map and the roadmap reach the commands that need them | 2026-10-28 | 6.2.0 (unchanged) |
| [ADR-135](decisions/volume-08.md#adr-135--the-post-620-audit-fix-set-ten-document-corrections) | The post-6.2.0 audit fix set: ten document corrections | 2026-10-28 | 6.2.0 (unchanged) |
| [ADR-136](decisions/volume-08.md#adr-136--the-post-620-audit-fix-set-ii-the-icon-cut-the-template-load-map-and-the-checks-self-description) | The post-6.2.0 audit fix set II: the icon cut, the template load map, and the check's self-description | 2026-10-28 | 6.2.0 (unchanged) |
| [ADR-137](decisions/volume-08.md#adr-137--the-appearance-authority-the-outline-icon-cut-the-light-default-the-focus-line-and-the-page-size-default) | The appearance authority: the outline icon cut, the light default, the focus line, and the page-size default | 2026-10-28 | 6.2.0 (unchanged) |
| [ADR-138](decisions/volume-08.md#adr-138--the-621-clarifications-the-typeface-two-terms-and-the-appearance-citation) | The 6.2.1 clarifications: the typeface, two terms, and the appearance citation | 2026-10-28 | 6.2.1 |
| [ADR-139](decisions/volume-09.md#adr-139--the-audit-repair-set-the-foundation-boundary-the-frame-and-traceability) | The audit repair set: the foundation boundary, the frame, and traceability | 2026-10-29 | 6.2.1 (unchanged) |
| [ADR-140](decisions/volume-09.md#adr-140--the-admin-slice-split-the-gate-slice-the-recorder-and-two-consumers) | The admin slice split: the gate slice, the recorder, and two consumers | 2026-10-29 | 6.2.2 |
| [ADR-141](decisions/volume-09.md#adr-141--the-transactional-sms-transport-twilio-behind-a-port) | The transactional SMS transport: Twilio behind a port | 2026-10-30 | 6.2.2 (unchanged) |
| [ADR-142](decisions/volume-09.md#adr-142--the-backup-and-restore-tooling-pgbasebackup-wal-archiving-and-the-sealed-archive) | The backup and restore tooling: `pg_basebackup`, WAL archiving, and the sealed archive | 2026-10-30 | 6.2.2 (unchanged) |
| [ADR-143](decisions/volume-09.md#adr-143--the-continuous-integration-provider-github-actions-offline-by-default) | The continuous-integration provider: GitHub Actions, offline by default | 2026-10-30 | 6.2.2 (unchanged) |
| [ADR-144](decisions/volume-09.md#adr-144--the-sbom-generator-cyclonedxcyclonedx-npm-per-build) | The SBOM generator: `@cyclonedx/cyclonedx-npm` per build | 2026-10-30 | 6.2.2 (unchanged) |
| [ADR-145](decisions/volume-09.md#adr-145--the-automated-accessibility-checker-axe-coreplaywright) | The automated accessibility checker: `@axe-core/playwright` | 2026-10-30 | 6.2.2 (unchanged) |
| [ADR-146](decisions/volume-09.md#adr-146--the-technology-standards-amendment-r1s-seven-register-gaps-closed) | The Technology Standards amendment: R1's seven register gaps closed | 2026-10-30 | 6.3.0 |
| [ADR-147](decisions/volume-09.md#adr-147--the-trade-names-arabic-form-no-diacritics) | The trade name's Arabic form: no diacritics | 2026-11-02 | 6.3.1 |
| [ADR-148](decisions/volume-09.md#adr-148--the-shared-shells-name-one-term-and-frame-as-its-accepted-synonym) | The shared shell's name: one term, and `frame` as its accepted synonym | 2026-11-04 | 6.3.2 |
| [ADR-149](decisions/volume-09.md#adr-149--the-silent-hidden-field-refusal-the-unstored-202-and-the-resume-read) | The silent hidden-field refusal: the unstored 202 and the resume read | 2026-11-05 | 6.3.2 (unchanged) |
| [ADR-150](decisions/volume-09.md#adr-150--the-copys-authority-and-its-measurable-bindings) | The copy's authority and its measurable bindings | 2026-11-05 | 6.3.2 (unchanged) |
| [ADR-151](decisions/volume-09.md#adr-151--the-identity-flows-technical-shape-better-auths-phone-number-extension-behind-the-auth-module) | The identity flow's technical shape: better-auth's phone-number extension behind the `auth` module | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-152](decisions/volume-09.md#adr-152--the-city-list-and-the-mobile-prefix-dataset-two-committed-reference-files) | The city list and the mobile-prefix dataset: two committed reference files | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-153](decisions/volume-09.md#adr-153--the-password-policys-local-source-seclists-top-100000-verified-at-boot) | The password policy's local source: SecLists' top 100,000, verified at boot | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-154](decisions/volume-09.md#adr-154--the-session-policy-two-clocks-an-activity-signal-and-tombstones) | The session policy: two clocks, an activity signal, and tombstones | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-155](decisions/volume-09.md#adr-155--the-rate-limit-and-transient-store-locations-postgres-tables-swept-hourly) | The rate-limit and transient-store locations: Postgres tables, swept hourly | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-156](decisions/volume-09.md#adr-156--the-frames-route-map-one-exported-map-for-every-link) | The frame's route map: one exported map for every link | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-157](decisions/volume-09.md#adr-157--the-provisioning-boundary-the-initial-password-and-the-audit-log) | The provisioning boundary, the initial password, and the audit log | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-158](decisions/volume-09.md#adr-158--public-api-versioning-and-the-deprecation-rule) | Public API versioning and the deprecation rule | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-159](decisions/volume-09.md#adr-159--the-sc-009-load-profile-and-its-verdict) | The SC-009 load profile and its verdict | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-160](decisions/volume-09.md#adr-160--spec-kit-scaffold-refreshed-to-132-the-reserved-command-and-extension-set-retained) | Spec Kit scaffold refreshed to 1.3.2; the reserved command and extension set retained | 2026-11-08 | 6.3.2 (unchanged) |
| [ADR-161](decisions/volume-09.md#adr-161--the-city-lists-object-envelope-and-version-200) | The city list's object envelope and version 2.0.0 | 2026-11-09 | 6.3.2 (unchanged) |

**Design-system note (ADR-093).** Every provision of the removed custom design
system in an earlier record is superseded by ADR-093. Their other provisions,
including the non-visual shell rules and the icon set, remain in force. The
records themselves are not rewritten.
