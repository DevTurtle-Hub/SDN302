# Task & Team Management App

A modern, responsive Task and Team Management technical foundation built with Next.js App Router, TypeScript, Prisma ORM, PostgreSQL (Supabase), and Tailwind CSS.

This is **Assignment 1**, focusing on technical foundations, Prisma database schema, Task CRUD APIs, and an interactive UI.

---

## Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router, Route Handlers)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database ORM:** [Prisma ORM](https://www.prisma.io/)
* **Database:** [PostgreSQL](https://www.postgresql.org/) (Hosted on [Supabase](https://supabase.com/))
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Code Quality:** [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)
* **Deployment:** [Vercel](https://vercel.com/)

---

## Features (Assignment 1)

* **Public Task CRUD Operations:**
  * Create tasks with Title, Description, Status, Priority, and Due Date.
  * Read tasks ordered newest first.
  * Update tasks in real-time without page reload.
  * Delete tasks with confirmation dialog.
* **Database Models:**
  * Full relational database schema with `User`, `Team`, `TeamMember`, and `Task`.
  * Proper foreign key relationships and cascade rules.
* **Modern Responsive UI:**
  * Clean, student-friendly layout supporting mobile (375px/390px) to desktop (1920px).
  * Real-time loading, saving, and deleting states to prevent button spamming.
  * Status filter (All, Todo, In Progress, Done).
* **Placeholders:**
  * Teams preview page (`/teams`) preparing for Assignment 2.
  * Login preview page (`/login`) preparing for authentication in Assignment 2/3.

---

## Project Structure

```text
task-team-management/
│
├── app/
│   ├── api/
│   │   └── tasks/
│   │       ├── route.ts          # GET (all tasks), POST (create task)
│   │       └── [id]/
│   │           └── route.ts      # PUT (update task), DELETE (delete task)
│   │
│   ├── login/
│   │   └── page.tsx              # Login placeholder ("Coming Soon")
│   ├── teams/
│   │   └── page.tsx              # Teams placeholder ("Coming Soon")
│   ├── favicon.ico
│   ├── globals.css               # Tailwind CSS imports & theme styles
│   ├── layout.tsx                # Root layout with shared Navbar & Footer
│   └── page.tsx                  # Interactive Task Management Homepage
│
├── components/
│   ├── Navbar.tsx                # Navigation header (TaskFlow, Home, Teams, Login)
│   ├── Footer.tsx                # App footer
│   ├── TaskForm.tsx              # Create & Edit Task form with validation
│   ├── TaskList.tsx              # Task list container with filtering & states
│   └── TaskItem.tsx              # Individual task card with badge & actions
│
├── lib/
│   └── prisma.ts                 # Prisma Client singleton pattern
│
├── prisma/
│   ├── migrations/               # Database migration history
│   └── schema.prisma             # Relational data schema (User, Team, TeamMember, Task)
│
├── public/                       # Static public assets
│
├── .env                          # Local environment variables (NOT committed)
├── .env.example                  # Environment variable template
├── .gitignore                    # Git ignore file (prevents secret leaks)
├── .prettierignore               # Files excluded from Prettier formatting
├── .prettierrc                   # Prettier configuration
├── package.json                  # Dependencies and build scripts
├── README.md                     # Documentation
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## Database Schema (ERD)

```mermaid
erDiagram
    User ||--o{ Team : "owns"
    User ||--o{ TeamMember : "joins"
    User ||--o{ Task : "assigned to"
    Team ||--o{ TeamMember : "has"
    Team ||--o{ Task : "contains"

    User {
        string id PK
        string name
        string email UK
        string password
        datetime createdAt
    }

    Team {
        string id PK
        string name
        string description
        string ownerId FK
        datetime createdAt
    }

    TeamMember {
        string id PK
        string teamId FK
        string userId FK
        string role
        datetime joinedAt
    }

    Task {
        string id PK
        string title
        string description
        TaskStatus status
        TaskPriority priority
        datetime dueDate
        string teamId FK "optional"
        string assigneeId FK "optional"
        datetime createdAt
    }
```

---

## Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

> **Security Note:** Never commit your `.env` file or database credentials to GitHub.

---

## Local Setup & Installation

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd task-team-management
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env` and fill in your Supabase connection string.

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Run Migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

7. **Prisma Studio (Optional GUI for Database):**
   ```bash
   npx prisma studio
   ```

---

## REST API Documentation

### 1. `GET /api/tasks`
* **Description:** Retrieve all tasks ordered from newest to oldest.
* **Status:** `200 OK`
* **Response:**
  ```json
  [
    {
      "id": "cm...1",
      "title": "Learn Next.js",
      "description": "Study App Router and Route Handlers",
      "status": "TODO",
      "priority": "MEDIUM",
      "dueDate": null,
      "teamId": null,
      "assigneeId": null,
      "createdAt": "2026-09-21T00:00:00.000Z"
    }
  ]
  ```

### 2. `POST /api/tasks`
* **Description:** Create a new task.
* **Status:** `201 Created`
* **Body:**
  ```json
  {
    "title": "Learn Prisma",
    "description": "Study Prisma Schema and Migrations",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2026-10-01"
  }
  ```

### 3. `PUT /api/tasks/:id`
* **Description:** Update an existing task.
* **Status:** `200 OK` (or `404 Not Found`)
* **Body:**
  ```json
  {
    "title": "Learn Prisma (Completed)",
    "status": "DONE"
  }
  ```

### 4. `DELETE /api/tasks/:id`
* **Description:** Delete a task by ID.
* **Status:** `200 OK` (or `404 Not Found`)
* **Response:**
  ```json
  {
    "message": "Task deleted successfully",
    "id": "cm...1"
  }
  ```

---

## Verification & Quality Checks

Run linting and production build checks before pushing:

```bash
# Validate Prisma schema
npx prisma validate

# Run ESLint
npm run lint

# Production build check
npm run build
```

---

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import repository in [Vercel](https://vercel.com/).
3. Set Environment Variables on Vercel:
   * `DATABASE_URL`: Connection string from Supabase (Transaction Pooler / 6543 or Session / 5432).
   * `DIRECT_URL`: Direct connection string (Port 5432) for running migrations.
4. Deploy!
