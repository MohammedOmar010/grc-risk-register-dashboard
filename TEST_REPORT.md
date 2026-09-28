# GRC Risk Register MVP V2.4 — Test Report

## V2.4 changes validated
- Cybersecurity GRC now has an **Add Risk** action in addition to management-level submission.
- GRC can select the owning / affected department when capturing a risk from email, call, meeting, monitoring, or informal escalation.
- A risk created directly by GRC starts at **Under GRC Review** and opens immediately in the formal assessment workflow.
- Director / Manager submission remains department-scoped and continues to use the guided five-question flow.
- **Open Audit Log** now reveals the audit section and scrolls directly to it.
- Audit Log was redesigned with event counters, event-type badges, actor / department context, chronological event cards, and an **Open Risk** action.
- Audit Log remains visible only in the Cybersecurity GRC role preview.

## Existing guided-flow checks retained
- Suggested long-text fields show a selector first; custom text input appears only for `Other / Custom` or an existing custom value.
- GRC Question 1 recommends the matching risk category and related control / treatment suggestions.
- Framework selection filters the control-reference guidance.
- Likelihood and Impact use clear 1–5 reference criteria while preserving GRC judgment and manual override.

## Static checks performed
- 9 executable TypeScript / TSX source files parsed successfully with the TypeScript compiler transpiler.
- `package.json` JSON validation passed.
- Source checks confirmed GRC Add Risk, selectable GRC department, direct transition to Under GRC Review, direct Audit Log scrolling, GRC-only audit labeling, and Open Risk navigation.

## Runtime / dependency note
This execution environment could not complete an online `npm install`, so final dependency resolution, `npm audit`, and `npm run build` should be run on the user's machine after extraction.

Recommended commands:

```bash
rm -rf node_modules package-lock.json
npm install
npm audit
npm run build
npm run dev
```
