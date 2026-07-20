# LocalLink — run it locally on Windows (no Docker)

This gets the full app running on your machine so you can click through it in your
own browser. Deployment to a real host is a separate step for later.

You'll run two things side by side: the backend (FastAPI, port 8000) and the
frontend (Next.js, port 3000). Keep two terminal windows open in VS Code.

---

## 0. One-time setup: PostgreSQL

If you don't already have PostgreSQL installed:

1. Download the installer from https://www.postgresql.org/download/windows/
2. Run it, keep the default port (5432), and set a password for the `postgres` superuser — remember it.
3. Once installed, open **pgAdmin** (installed alongside) or use `psql` from the Start Menu, and run:

```sql
CREATE USER locallink WITH PASSWORD 'locallink_dev_pw';
CREATE DATABASE locallink_db OWNER locallink;
```

(You can pick a different username/password — just make sure it matches `backend/.env` in the next step.)

---

## 1. Backend setup

Open a terminal in VS Code, navigate to the `backend` folder:

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create your `.env` file (copy `.env.example` and fill in your real values):

```powershell
copy .env.example .env
```

Edit `.env` in VS Code so `DATABASE_URL` matches what you created in step 0:

```
DATABASE_URL=postgresql://locallink:locallink_dev_pw@localhost:5432/locallink_db
SECRET_KEY=any-random-string-here
AI_API_KEY=
```

`AI_API_KEY` can stay empty — the chatbot gracefully falls back to a helpful static
message when it's not set, so nothing breaks.

Run the migrations and seed the starter categories:

```powershell
alembic upgrade head
python -m app.seed_categories
```

Start the backend:

```powershell
uvicorn app.main:app --reload
```

Check it worked by opening **http://localhost:8000/docs** in your browser — you
should see the Swagger UI with every endpoint listed. Leave this terminal running.

---

## 2. Frontend setup

Open a **second** terminal (leave the backend one running), navigate to `frontend`:

```powershell
cd frontend
npm install
```

Create your local env file:

```powershell
copy .env.local.example .env.local
```

The defaults are already correct for local dev:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

(Leave the Maps key empty for now — the provider page shows a coordinate label
instead of a live map until you add a real key. Everything else works fully without it.)

Start the frontend:

```powershell
npm run dev
```

---

## 3. Open it in your browser

Go to **http://localhost:3000**

Try this flow to see everything working together:
1. **Register** a customer account, then a separate **provider** account (use two different emails/browser tabs, or log out and back in)
2. As the provider: go to **Dashboard → Create profile**, pick a category, fill it in, then add an **availability** slot
3. As the customer: **Search**, open the provider you just created, and book a slot (try both payment options)
4. As the provider again: accept the booking from your dashboard, then mark it completed
5. As the customer: leave a review on the completed booking
6. To see the **admin dashboard**: you'll need an admin account — register one with role `ADMIN` directly via the Swagger UI at `/docs` (the frontend registration form only offers Customer/Provider, matching real-world practice where admins aren't self-service)

---

## Troubleshooting

**`alembic upgrade head` fails with a connection error** — check PostgreSQL is
actually running (Windows: check the "postgresql-x64-16" service in Services app)
and that the credentials in `.env` match what you created in step 0.

**Frontend shows network errors on every page** — make sure the backend terminal
is still running and showing `Application startup complete`. Check
`http://localhost:8000/health` loads directly in your browser.

**Port already in use** — something else is using 8000 or 3000. Find and stop it,
or run uvicorn on a different port (`--port 8001`) and update
`NEXT_PUBLIC_API_URL` in `.env.local` to match.

**Google Fonts warnings in the frontend terminal** — harmless, only happens if
your machine can't reach Google's font CDN; the site falls back to a system font.
