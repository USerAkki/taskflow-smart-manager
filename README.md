# TaskFlow - Smart Team Execution

TaskFlow is a full-stack project and task management app for teams. It combines role-based access, project membership, task assignment, smart priority scoring, dashboard insights, and optional AI-assisted task breakdowns.

## Features

- JWT authentication with admin and member roles
- Project creation, membership management, and progress tracking
- Task creation, assignment, deadline tracking, subtasks, and status updates
- Smart priority labels based on due dates and task state
- Mission Control dashboard with task status, priority distribution, workload, project health, alerts, and member modal
- AI task breakdown with a rule-based fallback when no API key is configured
- Light and dark mode toggle
- Demo accounts for quick review

## Tech Stack

Frontend:
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Lucide React

Backend:
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs

## Project Structure

```text
taskflow/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
    server.js
  frontend/
    src/
      assets/
      components/
      hooks/
      layouts/
      pages/
      services/
      utils/
      App.jsx
      main.jsx
```

## Environment Variables

Backend `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=change_this_to_a_long_random_secret
CLIENT_URL=http://localhost:5173
SEED_DEMO_DATA=true
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Local Setup

Install backend dependencies:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Install frontend dependencies:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5000/api/health`

## Demo Credentials

Admin:

```text
admin@demo.com
123456
```

Member:

```text
member@demo.com
123456
```

## Deployment

Backend deployment placeholder:

```text
https://your-backend.up.railway.app
```

Frontend deployment placeholder:

```text
https://your-frontend.up.railway.app
```

Production notes:

- Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, and optional `ANTHROPIC_API_KEY` in the backend host.
- Set `VITE_API_URL` to the deployed backend URL plus `/api`.
- Set `SEED_DEMO_DATA=false` if you do not want demo data created automatically.

## Scripts

Backend:

```bash
npm run dev
npm start
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```
