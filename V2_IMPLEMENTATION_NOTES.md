# V2.4 Implementation Notes

## Management submission
The form is intentionally business-facing. Directors and Managers answer five guided questions. A selected department-specific issue preset automatically aligns the remaining suggested answers to reduce inconsistent or unrelated submissions.

Cybersecurity GRC still owns formal risk wording, category, Likelihood, Impact, control mapping, treatment decision, residual reassessment, and closure.

## Department scope
- Cybersecurity GRC: All Departments or one selected department as a dashboard filter.
- Director / Manager: one selected department to simulate the signed-in department in the MVP.
- Production: the department must come from the authenticated user's profile and be enforced through server-side authorization / Supabase RLS.

## Risk preview
The eye icon now opens a read-only React modal. The previous browser `alert()` was only a temporary MVP shortcut and is removed from the risk preview flow.

## Editor CSS warning
`types/css.d.ts` declares `*.css` modules so VS Code / TypeScript does not incorrectly flag the valid Next.js global CSS import in `app/layout.tsx`.


## V2.4 direct GRC risk capture
Cybersecurity GRC can use the same guided business-context flow to create a risk when the concern did not arrive through the formal Director / Manager submission path. GRC can select the department, save the concern, and continue directly into formal assessment.

## V2.4 audit log UX
The Risk Register button now explicitly opens the GRC-only Audit Log and automatically scrolls to it. The section uses a clearer timeline/card layout, event counts, actor and department context, and direct navigation back to the related risk.
