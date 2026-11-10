# Design evidence — the Precision contract

This directory is the project's design evidence. It is not a specification and
it is not a visual baseline. It carries the reference material a specification
and a plan read: the contract's slice map, the reference screenshots, and the
manifest that names them.

## The authority

The token contract and the rendering rules are ADR-128. The conformance gate is
ADR-129. The pages, their blocks, their order, and their states belong to the
specification and to the slice map; ADR-128 deliberately does not fix them.
Three adopted departures sit beside the contract: the six part-family cards on
Home (ADR-130), the 90-day retention trigger (ADR-131), and the shell's
scroll-hide bar (ADR-132). The outline icon cut and the light default are not
departures: they are what the reference images render (ADR-137).

The external design lab is a reference frozen at its capture date. It is not a
dependency, no filesystem path to it appears in this repository, and nothing
here is copied from it as code. The manifest's `http://localhost:4321` URLs
record the capture source as provenance, not a dependency. Its screenshots are
evidence that the contract was rendered; they are evidence of composition, not
of measurement (the lab's footer band is shorter than ADR-128's 3.5rem while its
sidebar agrees with 15rem, and the slice map records the footer's divergence),
and they are not a baseline the product diffs against.

Capture drift: the screenshots were captured on 2026-10-27. The lab's shared
`:root` gained ten skeleton tokens on 2026-10-28, after the capture, so the
loading references predate those tokens. The layer records the final values;
the screenshots remain evidence, not a baseline.

## Reference versus baseline

- A **reference** is a screenshot in `screenshots/`, named by `manifest.json`.
  It shows the adopted contract on the lab's composition. It is read by a
  person or a plan.
- A **baseline** is generated inside this project, in continuous integration,
  with the same browser and fonts the product uses. It is what the conformance
  gate compares. No reference screenshot is a baseline.

## Contents

- `slice-map.md` — the seventeen slices and the twenty-eight pages, with each
  page's blocks, order, states, copy, behaviour, the lab-only material that is
  not transferred, the token reference, the screenshots, and the open questions
  a specification must answer. The eleven administrator pages are marked as
  composed from the contract, because the lab has no administrator application.
- `screenshots/` — the reference images, named
  `<slice>/<page>--<state>--<width>--<theme>.png`.
- `screenshots/manifest.json` — the manifest: kind, source, capture date, and
  one entry per image.

## Reading order

1. ADR-128 for the contract and the rendering rules; the layer records the full
   values (ADR-128 decision 2).
2. `slice-map.md` for the composition and the states of the slice in hand.
3. The slice's specification for the binding requirements.
4. The slice's plan for the baseline set and the gate, and for any literal
   Arabic copy the specification leaves open; the token values live in the
   layer, not in the plan.

## Status

The directory is the entry point. `slice-map.md` and `screenshots/` are the
evidence phase's artifacts; a slice whose map entry or reference image is
missing is not blocked from being specified, but its plan must record the gap
in its Complexity Tracking table with an owner and a review date.
