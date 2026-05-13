# GRC Risk Register & Dashboard

Arabic web-based GRC Risk Management dashboard for identifying, assessing, classifying, and monitoring cybersecurity and IT risks.

## Overview

This project is a practical GRC-focused web application designed to support cybersecurity and IT risk management. It allows users to document risks, assess likelihood and impact, calculate risk scores, track mitigation plans, assign ownership, and visualize risk exposure through interactive dashboards.

The project was built as a portfolio MVP to demonstrate practical understanding of Governance, Risk, and Compliance (GRC), risk assessment, control mapping, and executive risk reporting.

## Key Features

- Structured Risk Register for cybersecurity and IT risks
- Automated risk scoring using Likelihood × Impact
- Risk level classification: Low, Medium, High, Critical
- Risk ownership and mitigation tracking
- Risk treatment status monitoring
- NIST CSF 2.0 function mapping
- Selected NIST SP 800-53 control references
- Interactive dashboards for:
  - Risk levels
  - Risk status
  - Risk categories
  - Top risks
  - Executive summary indicators
- Arabic RTL interface
- Supabase database integration for persistent data storage

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- Supabase
- Git & GitHub
- Vercel

## GRC and Security References

This project uses selected concepts and references from:

- NIST Cybersecurity Framework (CSF) 2.0
- NIST SP 800-53 Rev. 5
- Risk scoring based on likelihood and impact
- Risk treatment and mitigation tracking
- Controls mapping for cybersecurity and IT risk management

> Note: This project does not claim full compliance with NIST frameworks. It uses selected references for educational and portfolio purposes.

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
