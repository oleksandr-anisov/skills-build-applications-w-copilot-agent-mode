# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Use React components and React Router routes for the four capabilities. Route API access through `src/api/client.ts`, preserve `/api` paths for the Vite proxy, and render distinct loading, success, empty, and accessible error states in every view.
- Logic tier decision: Keep Express route handlers thin and put validation and cross-model behavior in explicit service functions. Use deliberate `400`/`404` responses for invalid requests or missing resources rather than allowing Mongoose cast errors or unknown IDs to become `500` responses.
- Data tier decision: Define required Mongoose fields and defaults in the model schemas, and use one shared database configuration for connections. Seed stable demo records with upserts and reconcile existing demo-user team memberships without removing unrelated data.
- Activity tracking approach: Validate `type` and `minutes`, require well-formed existing `User` and `Team` ObjectIds, and let the service create the activity with positive computed points and an `occurredAt` timestamp. List activities without exposing extra business logic in the route.
- Team management approach: Require a team name and mascot, default `members` to an empty array, and preserve submitted member ObjectIds. Reject a missing name with `400` and expose the team shape consistently in create and list responses.
- Leaderboard approach: Aggregate activity `points` by team, sort descending, and add a 1-based rank only after sorting. Return `{ teamName, totalPoints, rank }` for each team.
- Workout suggestions approach: Look up the user by decoded email, return `404` when no user exists, and derive the user's preferred focus from a recent activity pattern or `fitnessGoal`. Select matching workouts first and include a human-readable `reason` based on the matched activity or goal.

## Test plan

Run the smallest relevant suite after each tier-level change, then run builds as final static checks.

| Check | Command | Current result | Meaning |
| --- | --- | --- | --- |
| Data contracts | `npm run test:data --prefix octofit-tracker/backend` | 4 failed, 1 passed | Mongoose validation is incomplete for `User`, `Team`, `Activity`, and `Workout`; the seed/idempotency contract currently passes. |
| API contracts | `npm run test:api --prefix octofit-tracker/backend` | 4 failed | Activity and team creation, leaderboard aggregation, and workout suggestion details are not implemented. |
| Frontend contracts | `npm test --prefix octofit-tracker/frontend` | 15 failed | Presentation data rendering and loading, empty, error, and workout-user request states are not implemented. |
| Backend build | `npm run build --prefix octofit-tracker/backend` | Passed | TypeScript currently compiles; passing the build does not verify runtime contracts. |
| Frontend build | `npm run build --prefix octofit-tracker/frontend` | Passed | React/Vite currently compile and bundle; passing the build does not verify the presentation contract tests. |

Implementation verification order:

1. Implement the data schemas and seed behavior, then run the data-tier suite.
2. Implement backend services and route behavior, then rerun the API suite.
3. Implement the shared frontend client usage and four capability views, then rerun the frontend suite.
4. Run both build commands after the focused suites pass.
5. Run `npm test --prefix octofit-tracker/backend` for a combined backend check only after both backend contract suites pass.
