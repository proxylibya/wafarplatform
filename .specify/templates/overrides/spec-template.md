# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Status**: Draft

**Input**: Parent roadmap: ROADMAP.md → R#. User description: "$ARGUMENTS"

<!--
  BINDING RULES FOR THIS DOCUMENT (governed by `.specify/memory/constitution.md`; the current version is in its footer and in `.specify/memory/version.json`) - NORMATIVE:
  1. Technology-agnostic (Principle VII): this file MUST NOT name languages,
     frameworks, libraries, databases, products, or architectural patterns.
     Product behaviour only; every technical detail belongs in plan.md.
  2. Identifiers (Principle I): FR-### for functional requirements, AC-### for
     acceptance criteria (assigned in the Acceptance Criteria section and
     nowhere else), SC-### for success criteria. Identifiers are stable for the
     life of the feature: never renumber, never reuse; withdraw an item
     by keeping its identifier and marking it withdrawn.
  3. Every FR MUST be testable and unambiguous; every FR SHOULD be covered by
     at least one AC; every AC MUST be referenced by at least one task.
  4. Test request (Principle III): the Test Coverage Request section MUST
     state explicitly whether unit, integration, and end-to-end test tasks
     are requested. Task generation reads that request from THIS file, not
     from the plan.
  5. Project Context Sources (binding) — read these before writing this
     specification, and keep it consistent with them:
       - `.specify/memory/constitution.md` — principles and governance; the
         Product Scope (pages, roles, product features), the Product Register
         (roles, the twenty-eight pages, the data entities and the cross-entity
         rules), the Usage Limits, and the Glossary that is the naming
         authority.
       - `Core-Project.txt` — the product definition: roles and their
         permissions, the page list, the file-processing sequence, and the
         statements the product already makes as acceptance criteria.
       - `docs/design/slice-map.md` — the slice's entry: its blocks and order,
         its states, its copy, and the open questions this specification must
         answer. Reference, not a source of rules; the binding version is this
         specification.
       - `ROADMAP.md` — the slice's scope, dependencies, and what this slice
         does not do (ADR-134).
       - the decision register — `docs/DECISIONS.md`'s index and the volumes
         under `docs/decisions/` (ADR-001 … ADR-161). A specification that
         contradicts one is a blocking defect.
       - `docs/domain-model.md` — the entities a Key Entities section may name,
         and the invariants such a specification MUST NOT contradict. A
         specification MUST NOT invent an entity, and MUST NOT restate the
         entity's columns: an entity, a relationship, or an invariant is a
         registered product fact changed only by amending the register and
         recording an ADR.
     Read the sections named above; for `docs/DECISIONS.md` read its index and
     the volume that holds the records this feature touches, not the whole
     register (ADR-071, ADR-125, Reading protocol).
     The technical sources (`docs/architecture.md`, `Project-Technologies.txt`)
     are bound in plan-template.md, NOT here: naming their content in this file
     would breach rule 1 (Principle VII).
     A page or a product feature that is not on the constitution's Product
     Scope list MUST NOT be specified without recording the addition in the
     plan's Complexity Tracking table.
-->

## User Scenarios & Testing *(mandatory)*

<!--
  User stories are PRIORITIZED user journeys (Principle VIII). Each one MUST be
  independently implementable, testable, and deliverable as an increment of
  value:
  - assign a priority (P1 is most critical);
  - the set of P1 stories MUST constitute a shippable MVP;
  - a story MUST be testable in isolation, without another story complete;
  - circular dependencies between stories are prohibited.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [The value it delivers, and why this priority level]

**Independent Test**: [How this story can be verified on its own — e.g.,
"Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**: covered by AC-001 – AC-002 in the Acceptance Criteria section.

---

### User Story 2 - [Brief Title] (Priority: P2)

[Same fields as User Story 1: description, Why this priority, Independent Test, and the story's AC range in Acceptance Scenarios]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Same fields as User Story 1: description, Why this priority, Independent Test, and the story's AC range in Acceptance Scenarios]

---

[Add more user stories as needed; each keeps its own priority and its own AC-### range]

### Edge Cases

<!-- Fill with the real boundary conditions and error scenarios. An edge case
     that needs its own verification becomes a numbered criterion in the
     Acceptance Criteria section instead of a loose bullet here. -->

- What happens when [boundary condition]?
- How does the system handle [error scenario]?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST [specific, testable capability]
- **FR-002**: System MUST [specific, testable capability]
- **FR-003**: Users MUST be able to [key interaction]
- **FR-004**: System MUST [data requirement]
- **FR-005**: System MUST [behaviour]

*Mark an unresolved requirement instead of guessing (maximum three per specification):*

- **FR-00X**: System MUST [NEEDS CLARIFICATION: the question that must be answered]

### Test Coverage Request *(mandatory)*

<!--
  Constitution Principle III. State the request plainly and technology-
  agnostically (do not name test tools). "Not requested" MUST carry a reason.
  When requested, task generation creates test tasks; when not requested, it
  creates none, and the 80% rule below has nothing to measure.
-->

- **Unit tests (business rules)**: [Requested / Not requested] — [if not requested, the reason]
- **Integration tests (module contracts)**: [Requested / Not requested] — [if not requested, the reason]
- **End-to-end tests (user journeys)**: [Requested / Not requested] — journeys covered: [US1, US2, ...]
- **Coverage target for changed production code**: at least 80% of changed lines.

### Key Entities *(include if the feature involves data)*

<!--
  Entities come from `docs/domain-model.md`. Name an entity this feature
  touches, say what it represents in business terms, and state the
  relationships this feature relies on. Do NOT list columns, types, or field
  names here: a specification stays technology-agnostic (Principle VII), and the
  physical shape is the owning module's schema file plus the plan's
  `data-model.md`. An entity this feature needs that the domain model does not
  carry is a register amendment plus an ADR, recorded in Complexity Tracking —
  never invented here.
-->

- **[Entity 1]**: [What it represents; the relationships this feature relies on]
- **[Entity 2]**: [What it represents; relationships]

## Acceptance Criteria *(mandatory)*

<!--
  CANONICAL HOME OF EVERY AC-### (Principle I). Each criterion is written here
  exactly once, grouped under its user story, in Given/When/Then form, with
  its functional requirement in parentheses. Identifiers are assigned in this
  section and nowhere else, and they are stable: never renumber, never reuse;
  withdraw an item by keeping its number and marking it "Withdrawn". Every
  AC-### here MUST be referenced by at least one task in tasks.md.
-->

### User Story 1 — [Brief Title] (P1)

1. **AC-001**: **Given** [initial state], **When** [action], **Then** [expected outcome] *(FR-001)*
2. **AC-002**: **Given** [initial state], **When** [action], **Then** [expected outcome] *(FR-002)*

### User Story 2 — [Brief Title] (P2)

3. **AC-003**: **Given** [initial state], **When** [action], **Then** [expected outcome] *(FR-003)*

### User Story 3 — [Brief Title] (P3)

4. **AC-004**: **Given** [initial state], **When** [action], **Then** [expected outcome] *(FR-004)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

<!--
  Technology-agnostic and measurable. Performance outcomes MUST be numeric
  (value + percentile, and the load condition where relevant); a performance
  budget without numbers is a defect (Query Safety and Secrets).
-->

- **SC-001**: [Measurable outcome — e.g., "Visitors see search results in under 1 second"]
- **SC-002**: [Measurable outcome — e.g., "A guest can complete a filtered search in under 30 seconds"]
- **SC-003**: [Measurable outcome — e.g., "95% of searches return results within the stated budget"]

## Assumptions

<!-- Document the reasonable defaults chosen where the feature description was
     silent: target users, scope boundaries, data/environment, dependencies on
     existing systems. -->

- [Assumption about target users]
- [Assumption about scope boundaries]
- [Assumption about data/environment]
- [Dependency on an existing system or service]
