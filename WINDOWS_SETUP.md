# Servio — run it locally on Windows (no Docker)

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
CREATE USER servio WITH PASSWORD 'servio_dev_pw';
CREATE DATABASE servio_db OWNER servio;
```

(You can pick a different username/password — just make sure it matches `backend/.env` in the next step.)

> **Important — this is the #1 cause of "pgAdmin shows no tables":** the app writes
> to whatever database is in `backend/.env` (`servio_db` above). In pgAdmin you must
> expand **exactly that database → Schemas → public → Tables** to see the 8 app
> tables. If you look at a different database (e.g. `postgres`) they won't be there.

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
DATABASE_URL=postgresql://servio:servio_dev_pw@localhost:5432/servio_db
SECRET_KEY=any-random-string-here
OPENROUTER_API_KEY=sk-or-v1-...your key here...
```

### Getting your OpenRouter API key (for the AI Assistant)

1. Go to **https://openrouter.ai** and sign in (Google/GitHub works).
2. Open **https://openrouter.ai/keys** → **Create Key**.
3. Copy the key (starts with `sk-or-v1-`) and paste it as `OPENROUTER_API_KEY` in `.env`.
4. Add a little credit at **https://openrouter.ai/credits**, *or* keep the default
   model — `openai/gpt-4o-mini` is cheap; if you prefer a free model set
   `OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free` in `.env`.

If `OPENROUTER_API_KEY` is left empty the assistant still loads but replies with a
helpful static fallback message instead of live AI answers — nothing crashes.

Run the migrations, seed starter categories, and create an admin account:

```powershell
alembic upgrade head
python -m app.seed_categories
python -m app.seed_admin
```

`seed_admin` creates `admin@servio.com` / `Admin123!` (change the password after
first login). You can also pass your own: `python -m app.seed_admin you@mail.com "YourPass" "Your Name"`.

Start the backend:

```powershell
uvicorn app.main:app --reload
```

Check it worked by opening **http://localhost:8000/docs** in your browser — you
should see the Swagger UI with every endpoint listed. Leave this terminal running.

> **Testing protected endpoints in Swagger:** click **Authorize**, then use the
> `/auth/token` form (enter your email as *username* + your password). This sets the
> bearer token for all `Try it out` calls, so admin/protected routes stop returning
> 401. The frontend itself uses `/auth/login` (JSON) — both issue the same token.

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
6. Click the **chat bubble** (bottom-right) and ask the **AI Assistant** something like "how do I book a plumber?"
7. To see the **admin dashboard**: log in with the admin account created by `seed_admin` (`admin@servio.com` / `Admin123!`) and open **Dashboard**

---

## Troubleshooting

**`alembic upgrade head` fails with a connection error** — check PostgreSQL is
actually running (Windows: check the "postgresql-x64-16" service in Services app)
and that the credentials in `.env` match what you created in step 0.

**pgAdmin shows no tables even though migrations ran** — you're almost certainly
looking at the wrong database. Confirm the database name in `backend/.env`
(`servio_db`) and expand *that* database in pgAdmin. Also run
`SELECT * FROM alembic_version;` — if it returns a revision id, the tables exist in
that database.

**Admin dashboard returns 401** — you're not logged in as an admin. Run
`python -m app.seed_admin`, then log in with those credentials. (401 = not
authenticated / no valid token; 403 = logged in but not an admin.)

**AI Assistant only gives the fallback message** — check `OPENROUTER_API_KEY` is set
in `backend/.env`, restart uvicorn (env is read at startup), and watch the backend
terminal: failed calls log the exact OpenRouter error (bad key, no credits, unknown model).

**Frontend shows network errors on every page** — make sure the backend terminal
is still running and showing `Application startup complete`. Check
`http://localhost:8000/health` loads directly in your browser.

**Port already in use** — something else is using 8000 or 3000. Find and stop it,
or run uvicorn on a different port (`--port 8001`) and update
`NEXT_PUBLIC_API_URL` in `.env.local` to match.
