# Cybersecurity GRC Risk Management — MVP V2.4

English management-facing risk submission and Cybersecurity GRC assessment platform.

## V2 workflow

**Director / Manager** submits only business context:
- Department (from user profile in the production design)
- Scope / Asset / Service
- Concern title and description
- Potential business impact
- Business consequence summary

**Cybersecurity GRC** performs the formal assessment:
- Risk statement and category
- Likelihood and impact
- Inherent risk score
- Risk owner
- Applicable framework and control reference
- Recommended controls
- Treatment option and mitigation plan
- Communication date
- Due date and implementation status
- Residual likelihood / impact after treatment implementation
- Closure / verification

## Saudi regulatory focus

- **NCA ECC 2-2024** is the primary framework option in the MVP.
- **CST CRF** is optional and should only be selected where CST regulatory scope applies.
- The application intentionally removes NIST CSF / NIST SP 800-53 mapping from the operational form.
- Exact regulatory control mapping is validated by Cybersecurity GRC against the organization's approved applicability / compliance matrix; the MVP does not invent automatic control IDs.

## Default MVP risk methodology

The application contains a configurable 1–5 semi-quantitative likelihood and impact scale for demonstration.
It is **not presented as an NCA-mandated scoring formula**. A real organization should replace the default criteria with its formally approved Cybersecurity Risk Management Methodology, risk appetite, criticality criteria, and approval matrix.

## Access model

The UI includes an **MVP Role Preview**:
- Cybersecurity GRC: enterprise portfolio and assessment actions
- Director / Manager: department-only view and risk-concern submission

For real privacy enforcement, use Supabase Auth and run the included `supabase-v2-auth-rls.sql` policies. UI filtering alone is not a security control.

## Supabase migration

1. Back up your current Supabase project.
2. Run `supabase-v2-schema.sql` in Supabase SQL Editor.
3. Keep the existing demo CRUD policies while testing the public MVP.
4. When Supabase Auth is implemented, review and run `supabase-v2-auth-rls.sql` to enforce department segregation and GRC-only audit access.
5. Add the existing environment variables to `.env.local` and Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Tech stack

Next.js · React · TypeScript · Tailwind CSS · Recharts · Supabase · GitHub · Vercel


## Fast MVP testing

Management submission fields provide suggested options while still allowing custom wording. Cybersecurity GRC assessment fields use the same quick-selection pattern where it improves consistency without forcing an inaccurate value.

If Supabase environment variables are missing, the UI opens safely in local demo mode instead of throwing a development-console error. Configure `.env.local` from `.env.example` when database persistence is required.

## Dependency security

This revision pins Next.js / eslint-config-next to `15.5.25` and intentionally removes the previous lock file so `npm install` can generate a fresh patched dependency tree. See `SECURITY_UPDATE.md`.


## V2.3 guided-assessment improvements

- Suggested long-text fields now show **one selector only**. The custom text area appears **only** when `Other / Custom` is selected (or when an existing saved value is already custom).
- GRC Question 1 (formal risk statement) recommends the matching risk category and prepares related control/treatment suggestions.
- Changing the risk category refreshes the recommended control actions and mitigation-plan suggestions.
- Selecting the regulatory framework filters the control-reference guidance shown in the next field.
- Selecting a recommended control prepares a related mitigation-plan suggestion while keeping all fields editable.
- The previous generic likelihood-guidance box was replaced by clear 1–5 likelihood and impact criteria that can be expanded when needed.
- The rating criteria are explicitly labeled as **MVP default guidance**, not an NCA/CST scoring formula.


## V2.4 GRC capture & audit navigation

- Cybersecurity GRC can now create a risk directly using **Add Risk** for concerns identified through monitoring, email, calls, meetings, or informal escalation.
- GRC selects the owning / affected department during capture; Director / Manager submissions remain department-scoped.
- Risks created directly by GRC start at **Under GRC Review** and open immediately in the formal GRC assessment workflow.
- **Open Audit Log** now reveals the audit section and scrolls directly to it, avoiding ambiguous button behavior.
- Audit Log was redesigned with event counters, event-type badges, actor / department context, and an **Open Risk** action for traceability.
- The MVP audit view is still metadata-derived; the production target remains an append-only authenticated audit service / RLS-protected table.
