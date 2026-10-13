# Meme'd Campaign Payout Tracker

A full-stack creator marketplace tool for tracking campaign performance and milestone-based payouts. Brands create campaigns with fixed budgets; creators submit Instagram or YouTube posts and earn according to the highest view milestone reached.

## Highlights

- JWT authentication with separate **brand** and **creator** roles
- Brand dashboard for creating campaigns and monitoring budget spent versus remaining
- Creator dashboard for browsing live campaigns, submitting posts, and tracking earnings
- Transactional MongoDB payout processing that prevents duplicate rewards and budget overspend
- Responsive Next.js interface built with Tailwind CSS and TanStack Query
- Jest and Supertest coverage for authentication, payout rules, budget caps, and concurrent updates

## Architecture

| Area | Technology |
| --- | --- |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, TanStack Query |
| Backend | Node.js 20, Express, TypeScript, Mongoose |
| Database | MongoDB Atlas replica set |
| Authentication | JWT and bcrypt password hashing |
| Tests | Jest, Supertest, `mongodb-memory-server` replica set |

The project uses npm workspaces:

```text
.
├── frontend/    # Next.js application
├── backend/     # Express API and payout logic
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20 LTS or newer
- A MongoDB Atlas cluster with a database user and your current IP address allowed

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `backend/.env` from `backend/.env.example`:

```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/memed?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
```

Create `frontend/.env.local` from `frontend/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Start the application

In separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000), create a Brand or Creator account, and follow the relevant dashboard flow.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev:backend` | Run the Express API in watch mode on port 4000 |
| `npm run dev:frontend` | Run the Next.js development server on port 3000 |
| `npm run build` | Create production builds for both workspaces |
| `npm test` | Run backend unit and integration tests |

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create a Brand or Creator account |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT |
| `GET`, `POST` | `/api/campaigns` | Browse live campaigns or create one as a Brand |
| `GET` | `/api/campaigns/mine` | View the authenticated Brand's campaigns |
| `POST` | `/api/submissions` | Submit a post as a Creator |
| `GET` | `/api/submissions/mine` | View a Creator's posts and total earnings |
| `PATCH` | `/api/submissions/:id/views` | Simulate a platform view-count update |

## Payout Rules

Each milestone is a total payout target, rather than a cumulative reward. A submission earns the difference between its current payout and the highest crossed milestone. When a campaign has insufficient funds, the remaining budget is awarded as the submission's final partial payout.

Campaign spend and submission payout are updated together in a MongoDB transaction. Repeated updates never duplicate a payout, and concurrent updates cannot push the campaign above its budget.

## Testing

```bash
npm test
```

Tests run with `MongoMemoryReplSet`, which gives Jest an ephemeral MongoDB replica set and allows the transaction logic to run exactly as it does against MongoDB Atlas.

## Deployment

### Backend: Railway

1. In Railway, create a project and add a service from this GitHub repository.
2. Set the service **Root Directory** to `/backend` and set its config file path to `/backend/railway.toml`.
3. Railway uses the committed configuration to install packages, build the API, start it, and verify `GET /health` before routing traffic.
4. Add `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, and `CLIENT_ORIGIN` in the Railway service Variables tab.
5. Generate a public Railway domain and set `CLIENT_ORIGIN` to the deployed Vercel frontend URL once it exists.

### Frontend: Vercel

Deploy `frontend` to Vercel, set the Vercel project root directory to `frontend`, and configure `NEXT_PUBLIC_API_URL` with the generated Railway API URL. Redeploy the frontend after setting this variable.

## Scaling Note

At 10,000 creators, use pagination for campaign and submission feeds, preserve the included query indexes, ingest platform metrics using queue-backed workers, and cache high-traffic public campaign lists with Redis plus explicit invalidation. Keep payout writes transactional and move high-volume view processing to background jobs.
