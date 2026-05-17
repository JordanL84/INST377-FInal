# Developer Manual

## Project Overview
HealthInfo Finder is a Node.js and Express web application that allows users to search MedlinePlus health topics through a backend API. The application stores recent searches in a Supabase database and visualizes search result counts using Chart.js.

---

# Installation

## 1. Clone or Download the Repository

Open the project folder in VS Code.

---

## 2. Install Dependencies

Run:

```bash
npm install
```

---

## 3. Create Environment Variables

Create a `.env` file in the root project directory.

Add:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_publishable_key
```

---

# Supabase Setup

Create a project at:

https://supabase.com

Open the SQL Editor and run:

```sql
create table search_history (
  id bigint generated always as identity primary key,
  search_term text not null,
  result_count integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

---

# Running the Application

Start the server:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

---

# Testing the Application

No automated tests are currently implemented.

Manual testing steps:

1. Run `npm start`
2. Open the homepage
3. Search for a topic such as `headache`
4. Confirm results appear
5. Confirm recent searches update
6. Confirm About and Help pages load correctly

---

# Server API Endpoints

## GET `/api/health-search?term=headache`

Searches the MedlinePlus Health Topics API and returns simplified JSON results to the frontend.

Example response:

```json
{
  "results": [
    {
      "title": "Headache",
      "summary": "Basic information...",
      "url": "https://medlineplus.gov/"
    }
  ]
}
```

---

## GET `/api/search-history`

Returns the 10 most recent searches from the Supabase database.

---

## POST `/api/search-history`

Writes a search record to the database.

Example request body:

```json
{
  "search_term": "headache",
  "result_count": 5
}
```

---

# Frontend Libraries Used

## Chart.js
Used to display recent search result counts visually.

## SweetAlert2
Used for popup alerts and user feedback.

---

# Known Bugs

- MedlinePlus returns XML data, so some summaries may occasionally contain shortened or inconsistent formatting.
- If Supabase environment variables are missing, database functionality will fail.
- The application is intended primarily for desktop browser usage.

---

# Future Development Roadmap

- Add stronger XML parsing
- Add user accounts and saved history
- Add category filtering
- Add detailed topic pages inside the app
- Improve mobile responsiveness