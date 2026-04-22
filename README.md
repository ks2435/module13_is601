# Module 13 — JWT Auth + Front-End + Playwright E2E

**Author:** Kamalesh — ks2435@njit.edu
**Repo:** https://github.com/ks2435/module13_is601
**Docker Hub:** https://hub.docker.com/r/ks2435/module13_is601

## Overview

FastAPI backend with JWT-based authentication plus two static HTML pages (register and login) tested end-to-end with Playwright.

- `POST /register` — creates a user, hashes password, returns a JWT.
- `POST /login` — verifies credentials, returns a JWT.
- `GET /me` — returns the current user (requires `Authorization: Bearer <token>`).
- `/static/register.html`, `/static/login.html` — vanilla HTML/JS front-end that stores the JWT in `localStorage`.

## Run Locally

```
docker compose up --build
```

Open http://localhost:8000/ (redirects to the register page).

Or run the app directly against the bundled Postgres:

```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
docker compose up -d db
uvicorn main:app --reload
```

## Manual Front-End Check

1. Open http://localhost:8000/static/register.html → fill the form → submit → see success message, token saved to `localStorage`.
2. Open http://localhost:8000/static/login.html → log in with the same email/password → see success message.
3. Swagger UI is at http://localhost:8000/docs.

## Run API Tests Locally

```
docker compose up -d db
python -m pytest tests -v --ignore=tests/e2e
```

## Run Playwright E2E Tests Locally

Requires Node.js 20+. In one terminal:

```
docker compose up -d db
uvicorn main:app --host 0.0.0.0 --port 8000
```

In a second terminal:

```
npm install
npx playwright install chromium
npx playwright test
```

## CI/CD

`.github/workflows/ci.yml` runs both pytest and Playwright, then — on a successful `master` push — builds and pushes the Docker image.

Required repo secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.

## Pull the Docker Image

```
docker pull ks2435/module13_is601:latest
```

