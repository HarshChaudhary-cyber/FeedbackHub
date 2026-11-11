# FeedbackHub — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved Foundation  
**Product Category:** Multi-Tenant B2B SaaS Feedback Management Platform  
**Target Market:** Small-to-Medium Businesses (SMBs) and Mid-Market Enterprises  

---

## 1. Executive Summary & Product Vision

**FeedbackHub** is an enterprise-ready, multi-tenant B2B SaaS platform engineered to help modern organizations collect, organize, analyze, and act on feedback from two distinct, critical audiences:
1. **External Customers** (product feedback, CSAT, NPS, bug reports, feature requests, testimonials)
2. **Internal Employees** (culture pulse surveys, workplace satisfaction, anonymous whistleblowing/suggestions, exit interviews)

The core value proposition is the unification of company feedback into a centralized, intelligent hub while delivering **completely customized, white-labeled company portals** accessed via dedicated subdomains (e.g., `abc.feedbackhub.com`, `nova.feedbackhub.com`). 

FeedbackHub bridges the gap between raw data collection and strategic action, offering conversational, high-converting respondent interfaces alongside a powerful, data-dense company dashboard.

---

## 2. Core Personas & User Types

| Persona | Description & Goals | Key Needs | Access Scope |
| :--- | :--- | :--- | :--- |
| **Platform Super Admin** | Internal FeedbackHub operations and site reliability engineering team. | System-wide observability, tenant management, subscription enforcement, security auditing. | Platform-wide global access; cross-tenant operational oversight. |
| **Company Owner** | Executive or team leader who purchases FeedbackHub for their company. | Workspace setup, custom subdomain branding, billing management, top-level analytics. | Full administrative control over their specific company tenant. |
| **Company Admin** | People Operations, Product Leads, or Customer Experience Managers. | Form authoring, publishing, user invitation, permission delegation, response review. | Broad company tenant control excluding subscription ownership transfers. |
| **Company Manager** | Department managers, team leads, or customer support supervisors. | Reviewing responses relevant to their department/team, assigning action items. | Scoped tenant access limited to authorized forms, departments, or categories. |
| **Customer Respondent** | External clients, app users, or buyers providing feedback. | Frictionless, brand-aligned, mobile-first, fast feedback submission. | Public tenant portal access; no account registration required. |
| **Employee Respondent** | Internal company staff participating in culture or pulse surveys. | Psychological safety, ironclad anonymity guarantees, honest submission channels. | Branded employee feedback portal; verified or anonymous modes. |

---

## 3. Product Architecture & Tenant Experience

### 3.1 Domain & Subdomain Topology
FeedbackHub operates on a centralized SaaS architecture with tenant-specific routing:
- **`feedbackhub.com`**: Public marketing website, pricing, feature highlights, and documentation.
- **`app.feedbackhub.com`**: Main SaaS management dashboard where authenticated company members log in and manage their workspaces.
- **`{company}.feedbackhub.com`**: Dedicated company portal displaying the company's branded feedback hub, public forms, and employee survey entrance.
- **Future Custom Domains** (e.g., `feedback.acme.com`): Supported via CNAME pointer to edge reverse proxy with dynamic SSL termination.

### 3.2 Dual Audience Collection Strategy

#### Customer Feedback Channel
- Publicly accessible or authenticated via customer portal tokens.
- Optimized for zero friction, high conversion rates, and conversational UX.
- Form types: Net Promoter Score (NPS), Customer Satisfaction (CSAT), Feature Request Boards, Bug Reports, General Inquiries.
- Customizable branding (logo, primary and accent colors, welcome message, success screen).

#### Employee Feedback Channel
- Hosted on company subdomain with privacy-first configuration.
- Supports both **Identified** (linked to verified employee profile/email) and **Strictly Anonymous** submissions.
- Form types: Weekly pulse, quarterly engagement, 360-degree peer feedback, manager reviews, anonymous suggestion box.
- Built-in privacy thresholds (minimum response aggregation limit to prevent identification in small teams).

---

## 4. Key Functional Requirements

### 4.1 Multi-Tenant Organization Management
- **Tenant Provisioning**: Self-service onboarding for new companies with instant subdomain assignment (`slug.feedbackhub.com`).
- **Brand Customization Engine**: Dynamic theming engine supporting custom logos, brand colors (hex code validation), typography scale, and favicon.
- **Role-Based Access Control (RBAC)**: Granular permissions matrix for Owner, Admin, and Manager tiers.

### 4.2 Dynamic Feedback Form Builder
- **Drag-and-Drop Form Designer**: Flexible question sequencing and section grouping.
- **Supported Question Types**:
  - Net Promoter Score (0-10 scale with dynamic rating categorization)
  - CSAT / Star Ratings (1-5 visual stars or emoji scale)
  - Single Choice (radio options) & Multi Choice (checkboxes)
  - Open-Ended Long Text & Short Text
  - Likert Scales (e.g., Strongly Disagree to Strongly Agree)
  - Numerical inputs & Dropdown selectors
- **Behavioral Logic**: Question branching / conditional logic based on previous answers.
- **Submission Rules**: Configurable anonymity enforcement (Anonymous Only, Identified Only, or Respondent Choice).

### 4.3 Response Ingestion & Management
- **Real-Time Submission Processing**: High-throughput validation and database ingestion.
- **Status Workflow**: Response lifecycle management (New, In Review, In Progress, Resolved, Archived).
- **Internal Collaboration**: Private internal notes, tagging, and assignment to specific company managers without exposing notes to respondents.
- **Export Capabilities**: CSV, JSON, and PDF report downloads with RBAC permission validation.

### 4.4 Analytics & Intelligence
- **Aggregate Dashboards**: Overall satisfaction trends, response velocity, NPS breakdown (Promoters, Passives, Detractors).
- **Departmental Filtering**: Segmentation by team, department, or location (with privacy floor enforcement).
- **Sentiment & Keyword Analysis**: Future AI-assisted sentiment categorization (Positive, Neutral, Negative) and thematic clustering.

### 4.5 Subscription, Billing & Quota Management
- **Tiered Plans**: Free Starter, Professional, Enterprise.
- **Quota Enforcement**: Active forms limit, monthly response volume cap, team seat limits, custom domain availability.
- **Billing Integration**: Razorpay integration prepared for Indian and international subscription flows with webhook reconciliation (stubbed in early phases).

---

## 5. Non-Functional & Security Requirements

| Category | Requirement | Specification |
| :--- | :--- | :--- |
| **Data Isolation** | Multi-tenant isolation at application and database layers. | Strict `companyId` scoping on all queries; PostgreSQL Row-Level Security (RLS) enforcement. |
| **Anonymity Guarantee** | Zero personally identifiable records on anonymous responses. | Strict separation of respondent identities; zero IP/User-Agent retention for anonymous forms. |
| **Authentication** | Modern, attack-resilient session management. | Secure, HttpOnly, SameSite=Lax cookie-based sessions; Argon2id password hashing. |
| **Performance** | Rapid page loads and instant form submission. | Sub-200ms API response time (p95); lightweight client bundle (<200kB initial JS). |
| **Accessibility** | WCAG 2.1 Level AA compliance. | Full keyboard navigation, ARIA landmarks, high contrast ratios, reduced motion support. |
| **Availability** | Highly available cloud deployment. | 99.9% uptime SLA target; automated database backups with point-in-time recovery. |

---

## 6. Out of Scope for Phase 1

- Live credit card transactions and active Razorpay charge runs.
- Production third-party OAuth providers (Google, Microsoft SSO).
- Live email transmission via Resend API (outbox queuing/logging implemented instead).
- AI automated sentiment extraction pipelines.
- Multi-region database replication.
