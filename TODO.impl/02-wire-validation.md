# 02 — Wire: validation pipeline

Status: DONE (implemented + specs green)

Objective: OCP validation — each check is a class registered in
Wire::Validation::Runner; adding a check never modifies existing ones.

Checks: Model, Vocabulary (incl. distribution/origin vs sites registry),
Media (existence, alt text on hero/figure), Lifecycle (status/embargo/
supersedes/timestamps invariants).

Acceptance: valid sample passes; tampered samples produce the right
violations (specs use real items, no doubles).
