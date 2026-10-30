# CivicLens – EmailJS Setup Guide (Admin Only)

> **This configuration is done once by the website administrator.**  
> Citizens, officers, and workers do not touch any of these settings.

---

## 1. Create an EmailJS Account

1. Go to [https://www.emailjs.com](https://www.emailjs.com)
2. Sign up for a free account (supports up to 200 emails/month on free tier)

---

## 2. Add an Email Service

1. In the EmailJS dashboard → **Email Services** → **Add New Service**
2. Choose your provider (Gmail, Outlook, SMTP, etc.)
3. Connect your sending account
4. Copy the **Service ID** (e.g. `service_abc1234`)

```env
VITE_EMAILJS_SERVICE_ID=service_abc1234
```

---

## 3. Create Template 1 – Worker Assignment Email

1. Dashboard → **Email Templates** → **Create New Template**
2. Set **Subject**: `CivicLens – New Complaint Assigned: {{complaint_id}}`
3. Paste this body:

```
Hello {{worker_name}},

A new complaint has been assigned to you for field resolution.

Complaint ID: {{complaint_id}}
Department: {{department_name}}
Category: {{category}}
Description: {{description}}
Location: {{location}}
Priority: {{priority}}
Assigned by: {{assigned_officer}}
Date Assigned: {{assignment_date}}
Notes: {{assignment_notes}}

Log in to the CivicLens portal to view and manage this complaint:
{{worker_dashboard_url}}

Regards,
CivicLens Team
```

4. In the **To Email** field use `{{to_email}}` (EmailJS dynamic recipient)
5. Save → copy the **Template ID** (e.g. `template_wrk9876`)

```env
VITE_EMAILJS_TEMPLATE_WORKER_ASSIGNED=template_wrk9876
```

---

## 4. Create Template 2 – Citizen Live Tracker Email

1. Dashboard → **Email Templates** → **Create New Template**
2. Set **Subject**: `CivicLens – Your Complaint {{complaint_id}} Has Been Updated`
3. Paste this body:

```
Hello {{citizen_name}},

Your complaint has received a new progress update.

Complaint ID:    {{complaint_id}}
Category:        {{category}}
Department:      {{department_name}}
Current Status:  {{status}}
Last Updated:    {{updated_at}}

To view the latest progress, open your CivicLens live complaint tracker:

{{tracker_url}}

You can view the current complaint status, department updates and available
progress information through your tracker.

Regards,
CivicLens Team
```

4. In the **To Email** field use `{{to_email}}`
5. Save → copy the **Template ID** (e.g. `template_cit5432`)

```env
VITE_EMAILJS_TEMPLATE_CITIZEN_TRACKER=template_cit5432
```

---

## 5. Get Your Public Key

1. Dashboard → **Account** → **API Keys**
2. Copy the **Public Key** (NOT the private key — never expose the private key)

```env
VITE_EMAILJS_PUBLIC_KEY=ABCdef123XYZ
```

> ⚠️ **Never commit your public key to a public repository.**  
> Keep it only in `frontend/.env` (which is git-ignored).

---

## 6. Fill in `frontend/.env`

Open `frontend/.env` and set all four values:

```env
VITE_EMAILJS_SERVICE_ID=service_abc1234
VITE_EMAILJS_PUBLIC_KEY=ABCdef123XYZ
VITE_EMAILJS_TEMPLATE_WORKER_ASSIGNED=template_wrk9876
VITE_EMAILJS_TEMPLATE_CITIZEN_TRACKER=template_cit5432
```

---

## 7. Restart the Dev Server / Redeploy

```bash
# Local dev
cd frontend
npm run dev

# Production
npm run build
# then deploy dist/ to your hosting provider
```

---

## How the System Works (No Citizen Action Required)

| Event | Who receives email | Email address source |
|---|---|---|
| Complaint submitted | Citizen | Supabase auth profile (`users.email`) |
| Complaint assigned to department | Citizen | Supabase auth profile |
| Worker assigned to complaint | **Worker** + Citizen | Worker: `users.email` JOIN; Citizen: same |
| Work started / progress updated | Citizen | Supabase auth profile |
| Work submitted for review | Citizen | Supabase auth profile |
| Complaint resolved / rejected | Citizen | Supabase auth profile |
| Citizen confirms resolution | Citizen | Supabase auth profile |
| Complaint reopened | Citizen | Supabase auth profile |

- Citizens **never** enter their email again after registration
- Workers **never** configure anything
- All email addresses are retrieved automatically from the authenticated Supabase `users` table
- The system gracefully skips sending (and logs `FAILED`) if no registered email is found — it never uses a fallback/hardcoded address

---

## Email Simulation Mode (Dev / No Credentials)

If `frontend/.env` is empty or incomplete, the system runs in **simulation mode**:
- Emails are printed to the browser console as `[EmailJS Dev Mode] Simulated ... to: ...`
- Delivery status is logged as `SIMULATED`
- All complaint operations continue normally — no email failure blocks portal functionality

---

## Troubleshooting

| Problem | Fix |
|---|---|
| No emails delivered | Check all 4 env vars are set and server restarted |
| EmailJS 401 error | Public key is wrong or account suspended |
| Wrong recipient receives email | Report bug — system reads `users.email` from DB join |
| Citizen gets another citizen's email | Impossible by design — email is fetched via `complaint.citizenId = users.id` JOIN |
| Duplicate emails | 8-second deduplication window prevents rapid double-send |
| Failed email reverted my assignment | Not possible — email failures are caught and logged separately |
