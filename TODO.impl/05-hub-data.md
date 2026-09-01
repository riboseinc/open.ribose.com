# 05 — Hub: data layer (SSOT)

Status: DONE

Objective: hub consumes registries, never edits them. scripts/sync-data.sh
copies portfolio/{platforms,domains,suites}.yaml + wire publish output +
wire sites registry into hub/data/ with PROVENANCE.md. TS types mirror
the registries; readers are the only code touching data files.
