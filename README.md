# Flexiple AI Recruiter — Sourcing Refinement Loop

An end-to-end demo of the core Flexiple AI recruiter loop: a recruiter describes who they're
hiring for in plain English, the system turns that into structured search criteria, scores a
locally-filtered candidate pool against a fit rubric, and lets the recruiter refine the search
with natural-language feedback until they're ready to freeze it.

This is a focused implementation of one workflow, not a platform. See [What was cut](#what-was-intentionally-cut) for scope decisions.

## 1. Overview

The flow implemented here is exactly:

1. Recruiter enters a free-text requirement.
2. Gemini parses it into **objective filters** (skills, experience range, location, company
   background) and a **subjective fit rubric**.
3. The backend deterministically filters the local candidate dataset against those filters —
   the LLM never decides who is objectively in or out.
4. Gemini scores the filtered candidates against the rubric, grounding every explanation in the
   candidate's real data.
5. The recruiter reviews the top 4-5 candidates and gives feedback ("1 is too junior, 2 and 4
   are right").
6. Gemini interprets that feedback into updated filters/rubric, explains exactly what changed
   and why, and the app re-filters + re-scores.
7. Steps 5-6 repeat until the recruiter clicks **Freeze search**, which locks in the final
   filters, rubric, and shortlist.

## 2. Architecture

```
client/ (React + TypeScript + Vite + MUI)
  src/
    components/   SearchInput, SearchCriteria, FilterEditor, RubricEditor,
                   CandidateCard, CandidateList, RefinementChat, ChangeSummary,
                   LoadingState, EmptyState, ErrorState, FrozenSummary
    pages/         SearchPage - composes the above into the full workflow
    hooks/         useSearch - owns all session state and API calls
    services/      api.ts - typed fetch wrapper, no secrets, talks to /api/*
    types/         Candidate, Filters, SearchResponse, RefineResponse, ...

server/ (NestJS + TypeScript)
  src/
    search/        SearchController -> SearchService (thin controller, all logic in service)
    llm/            GeminiService - the only module that talks to Gemini
    candidates/     CandidatesService - loads data/profiles.json once, deterministic filtering
    prompts/        parse-search / score-candidates / refine-search prompt builders
    common/         Zod schemas for LLM output, controlled exceptions, global error filter
  data/profiles.json  the supplied candidate dataset (48 profiles)
```

Request flow for a search:

```
POST /api/search { query }
  -> SearchController (validates DTO)
  -> SearchService.search()
       -> GeminiService.generateSearchCriteria(query)   [LLM call #1: parse]
       -> CandidatesService.filter(filters)              [deterministic, local]
       -> GeminiService.scoreCandidates(query, rubric, filtered)  [LLM call #2: score]
       -> sort by score, take top 5
  <- { filters, rubric, results }
```

Refinement (`POST /api/search/refine`) re-runs the same filter → score pipeline, but the first
LLM call is `refineSearch()` instead of `generateSearchCriteria()`, taking the current
filters/rubric/candidates/feedback and returning updated filters/rubric plus an explicit
`changes[]` list.

`POST /api/search/score` exists for the case where the recruiter edits filters/rubric **directly**
in the UI (not via the feedback chat) — it re-runs local filtering + LLM scoring against the
edited criteria without going through feedback interpretation, since there's no feedback to
interpret.

## 3. Tech stack

- **Frontend**: React 19, TypeScript (strict), Vite, MUI (Material UI)
- **Backend**: Node.js, NestJS, TypeScript (strict)
- **LLM**: Google Gemini (`@google/generative-ai`), structured JSON output, server-side only
- **Validation**: `class-validator` for request DTOs, `zod` for LLM response shapes
- **Data**: the supplied `profiles.json` (48 candidates), loaded into memory — no database

## 4. Setup

Requires Node.js 20+.

### 4.1 Environment variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```
GEMINI_API_KEY=your_gemini_api_key_here   # required - get one at https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-flash-latest          # optional, this is the default (a Google-maintained
                                           # alias so it doesn't go stale as specific model
                                           # versions are deprecated)
PORT=4000                                 # optional
CLIENT_ORIGIN=http://localhost:5173       # optional, for CORS
```

The server refuses to start without `GEMINI_API_KEY`. The key is read only via
`ConfigService` on the server and is never sent to or referenced by the client.

### 4.2 Install and run the backend

```bash
cd server
npm install
npm run start:dev
```

Server listens on `http://localhost:4000`. On boot it logs how many candidate profiles it
loaded, so you can confirm the dataset is wired up correctly.

### 4.3 Install and run the frontend

```bash
cd client
npm install
npm run dev
```

Client runs on `http://localhost:5173`. The Vite dev server proxies `/api/*` to
`http://localhost:4000`, so no client-side environment variables are needed.

Open `http://localhost:5173` and try:

> RDS developers with 4-7 years of experience who have worked at startups, for a role based in
> Bangalore.

(This example is deliberately answerable by the supplied dataset — several candidates are a
close match, several are close-but-not-quite, to make the refinement loop meaningful.)

## 5. The sourcing/refinement loop in detail

- **Objective filters are never inferred by an LLM at filtering time.** Gemini only proposes
  what the filters *should be*; `candidates/candidate-filter.util.ts` applies them with plain
  TypeScript — case-insensitive substring skill matching, min/max experience range, location
  substring match, and company-type matching against **either** the candidate's current company
  or any past company (so "worked at startups" can be satisfied by prior experience, not just
  the current job).
- **Scoring is grounded.** The scoring prompt sends only the fields available on each filtered
  candidate and explicitly instructs Gemini to cite only those fields — no invented years of
  experience, employers, or skills. The backend also drops any score entry whose `candidateId`
  doesn't match a real filtered candidate, so a hallucinated ID can't leak into the UI.
- **Refinement is fully LLM-driven, not scripted.** `POST /api/search/refine` sends the original
  query, current filters/rubric, the exact candidates the recruiter saw (in display order, so
  "candidate 1" resolves unambiguously), and the recruiter's raw feedback to Gemini, which
  returns updated filters/rubric **and** a `changes[]` array with a `reason` per changed field.
  The UI renders that as "what changed" / "why it changed" directly from the model's own
  reasoning — nothing here is hardcoded per example query.
- **Filters and rubric stay editable and visible** throughout the workflow (`SearchCriteria`),
  independent of the feedback chat — a recruiter can hand-edit `minYearsExperience` directly and
  click "Apply changes & re-run" without writing a feedback sentence.
- **Feedback can be typed, per-candidate, or both.** Each `CandidateCard` has a thumbs up/down to
  mark a candidate a right fit or not; marking any candidates builds a plain-language note (e.g.
  "Candidate 1 (Ananya Rao) is marked as not a fit.") that's combined with anything typed in the
  refinement box before being sent to Gemini as the same `feedback` string — there's no separate
  code path for the two input styles.

## 6. LLM architecture

`server/src/llm/gemini.service.ts` is the only file that calls Gemini. It exposes exactly three
methods, matching the three prompts:

- `generateSearchCriteria(query)` → `prompts/parse-search.prompt.ts`
- `scoreCandidates(query, rubric, candidates)` → `prompts/score-candidates.prompt.ts`
- `refineSearch(query, filters, rubric, candidates, feedback)` → `prompts/refine-search.prompt.ts`

Every call requests **structured JSON output** via Gemini's `responseSchema` (see
`llm/gemini.schemas.ts`), so the model is constrained to a fixed shape at generation time. The
raw JSON is then independently re-validated with **Zod** (`common/validation/llm-schemas.ts`)
before anything touches business logic — the app never trusts Gemini's output just because it
parsed as JSON.

### Prompt strategy

Each prompt (in `server/src/prompts/`):

- States the model's role and the exact task.
- Distinguishes **objective** facts (checkable filters) from **subjective** judgment (the
  rubric), and tells the model not to blend them.
- Embeds only the candidate fields relevant to that call (never the whole dataset, never
  unnecessary fields).
- Explicitly forbids inventing candidate facts and requires every scoring explanation to be
  traceable to a supplied field.
- For refinement, requires a `reason` tied to specific feedback/candidate for every changed
  field, and forbids changing fields the feedback doesn't support.

## 7. Validation & error handling

- **Request validation**: NestJS `ValidationPipe` with `whitelist`/`forbidNonWhitelisted` on all
  DTOs (`search/dto/*.dto.ts`) — query/feedback length limits, a fixed `companyTypes`
  vocabulary, numeric bounds on experience, array size caps.
- **LLM response validation**: every Gemini response is parsed with Zod before use. A failure
  (malformed JSON, wrong shape, out-of-range score) throws a controlled `LlmInvalidResponseException`
  — never a crash, never a raw parse error surfaced to the client.
- **Network/provider failures**: timeouts, rate limits (HTTP 429), and provider outages are
  each mapped to a distinct, safe error code (`LLM_TIMEOUT`, `LLM_RATE_LIMITED`,
  `LLM_UNAVAILABLE`) with a human-readable message and no internal details.
- **Transient Gemini failures are retried automatically.** A `503` ("model overloaded") or `429`
  (rate limited) response is retried up to twice with a short backoff before giving up
  (`GeminiService.callWithRetry`) — verified live against the real API, which does return `503`
  under load. Only the final failure is surfaced to the client; a timeout from our own side is
  never retried, since the recruiter's own client-side timeout would already have moved on.
- **Global exception filter** (`common/filters/http-exception.filter.ts`) guarantees no
  unhandled exception ever returns a stack trace to the client; anything unexpected is logged
  server-side and returned as a generic 500.
- **Frontend recovery**: every async action tracks its own inputs, so `retry()` in `useSearch`
  re-issues the exact failed request (search, edit-and-rerun, or refine) without losing the
  recruiter's current filters/rubric/results.

## 8. Security considerations

- `GEMINI_API_KEY` is read via `ConfigService` on the server only; the client has no API keys or
  secrets. `.env` is git-ignored; `.env.example` documents the required shape.
- All LLM calls happen server-side (`GeminiService`); the client never talks to Google directly.
- Candidate data always comes from the server's in-memory copy of `profiles.json`. The refine
  endpoint takes only `candidateIds`; the server looks up the real records itself rather than
  trusting any candidate data the client might send.
- No `eval`, no execution of LLM-generated code, no raw HTML rendering of LLM output — all LLM
  text is rendered as plain React text content (auto-escaped by React).
- Every request body is validated and whitelisted; unknown fields are rejected.
- Errors never leak provider details or stack traces (see above).

## 9. Key engineering decisions

- **Zod for LLM output, class-validator for request DTOs** — two different trust boundaries
  (an external AI provider vs. the app's own client) validated with the tool that fits each.
- **Company-type matching checks current *and* past companies** — "worked at startups" is a
  career-history claim, not just a current-employer claim, and the dataset's `past_companies`
  field makes this cheap to support correctly.
- **A dedicated `/api/search/score` endpoint** for direct filter/rubric edits — reusing
  `/api/search/refine` for this would have forced every manual edit through an unnecessary
  feedback-interpretation LLM call, even though the recruiter's intent is already fully
  specified by the edit itself.
- **Rotating stage messages instead of a fake progress bar** — the backend's search/refine
  pipeline is a single request/response (parse → filter → score in one call), so the frontend
  can't get true incremental progress without adding streaming complexity out of scope for this
  assignment. Cycling through honest stage descriptions ("Understanding your search...",
  "Evaluating the shortlisted profiles...") communicates what's happening without fabricating
  precision the app doesn't have.

## 10. What was prioritized

Per the assignment's own ordering: end-to-end functionality and refinement loop quality first,
then LLM interaction quality, structured output validation, and grounded explanations, then
error handling, clean UX, and reusable architecture.

## 11. What was intentionally cut

- No authentication, persistence, database, or multi-user support — session state lives in
  React state for the duration of one browser session, as specified.
- No streaming/incremental LLM output — each pipeline stage is a single request/response.
- No candidate CRUD, admin panel, or dataset editing UI.
- No pagination beyond the top 4-5 shortlist (the assignment's scope).
- No "unfreeze" action — freezing is presented as a deliberate final step; starting over uses
  "Start new search" instead of a reversible toggle.

## 12. Known limitations

- Skill matching is substring-based (case-insensitive, bidirectional), not semantic — it
  handles the dataset well (e.g. "RDS" ↔ "AWS RDS") but won't catch synonyms with no textual
  overlap (e.g. "Postgres" vs. "PSQL").
- The rotating loading-stage messages are a client-side approximation of pipeline progress, not
  literal real-time status from the server (see decision above).
- Company-type vocabulary is fixed to the four values present in the dataset (`startup`,
  `scaleup`, `enterprise`, `agency`); a differently-shaped dataset would need this updated.

## 13. Testing

Backend unit tests (`npm test` inside `server/`) cover:

- Deterministic candidate filtering, including edge cases (empty filters, no matches, missing
  optional history, combined AND filters, current-vs-past company type matching).
- Zod validation of LLM responses (accepts well-formed output, rejects malformed/out-of-range
  output).
- `SearchService` state transformations (sorting/trimming to top 5, dropping candidates with no
  score instead of crashing, preserving display order into refinement, propagating `changes`).
- Request DTO validation (length limits, fixed vocabularies, required fields).

Given the timebox, this favors coverage of business logic and validation over UI/e2e tests.
