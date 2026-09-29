# GRC Risk Register MVP V2.5 — Test Report

## V2.5 changes validated
- Executive KPIs now use **Total Risks, Critical, High, Within Plan, Overdue Plans, and No Plan**.
- The previous **Open** KPI was removed.
- Critical and High count active risks only so closed historical risks do not distort current executive exposure.
- **Within Plan** = not closed + treatment/action plan exists + due date exists + due date is today or later.
- **Overdue Plans** = not closed + treatment/action plan exists + due date has passed.
- **No Plan** = not closed + missing treatment/action plan or due date.
- All KPI cards are clickable and filter the Risk Register, then scroll directly to it.
- Added **Severity Distribution** for active risks with clickable severity filters.
- Added **Workflow Status Distribution** with clickable status filters; **Closed** remains visible here and can filter the register.
- Added **Department Risk Distribution** for Cybersecurity GRC with clickable department filtering.
- Risk Register displays the active dashboard filter and provides a one-click clear action.
- Management submission Questions 1–5 are marked required with `*`.
- Submission validation highlights missing fields, shows field-level guidance, scrolls to the first missing question, and focuses it.
- GRC assessment uses stage-aware required fields: core assessment fields are mandatory, treatment fields become mandatory when treatment is assigned, and residual ratings become mandatory after implementation / verification.
- Save and communication actions use the same validation and return the user to the first missing field.
- Closing a risk requires Implementation Status = **Verified**.

## Static checks performed
- 9 executable TypeScript / TSX source files parsed successfully with the TypeScript compiler transpiler.
- Static source checks confirmed removal of Open KPI, all three chart sections, KPI-to-register filtering, required-field markers, first-error scrolling, conditional residual requirements, and retention of Closed in workflow reporting.

## Runtime / dependency note
The execution environment could not complete the online `npm install`, so the final dependency resolution, `npm audit`, and production build should be run on the user's machine after extraction.

Recommended commands:

```bash
npm install
npm audit
npm run build
npm run dev
```
