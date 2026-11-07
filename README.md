
<div align="center">

# 🎓 Scholara

### SMART EDUCATION MANAGEMENT SYSTEM

A centralized education management portal designed to organize academic activities, manage student and teacher workflows, coordinate weekly routines, and streamline assignment tracking.

<br/>

![Next.js](https://img.shields.io/badge/Next.js-Framework-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Language-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Status](https://img.shields.io/badge/Status-Project-success?style=for-the-badge)

<br/>

**[🌍 Live Demo](https://scholara-hub.vercel.app)**

</div>

---

## 📖 About the Project

**Scholara** is a smart education management system developed to simplify and organize academic management through a centralized digital platform.

The system provides separate role-based experiences for Students, Teachers, and Heads, allowing each user to access the tools and information relevant to their responsibilities.

It focuses on structured weekly academic planning, student routines, assignment management, task submissions, teacher evaluations, and performance monitoring.

Instead of managing academic activities through disconnected processes, Scholara brings essential educational workflows together in one organized environment.

## ✨ Key Features

- 🔐 **Role-Based Authentication** — Separate access and dashboards for Students, Teachers, and Heads.
- 📅 **Weekly Academic Planning** — Create and manage weekly academic schedules.
- 📚 **Routine Management** — Organize daily activities and scheduled learning tasks.
- 📝 **Assignment Management** — Assign, submit, review, and resubmit student assignments.
- ⏱️ **Routine Timeline** — Track tasks using Passed, Current, and Upcoming statuses.
- 👨‍🎓 **Student Management** — Manage student activities and academic progress.
- 👨‍🏫 **Teacher Management** — Organize teacher responsibilities and academic workflows.
- 📎 **File Uploads** — Submit supporting documents and media for assignments.
- 👁️ **Submission Preview** — Review uploaded assignment materials.
- 💬 **Teacher Reviews** — Provide feedback and evaluate submitted work.
- 📊 **Performance Tracking** — Monitor student scores and academic progress.
- ⚙️ **Centralized Management** — Head-level access to academic planning and management.

## 👥 User Roles

Scholara provides dedicated interfaces for three primary user roles.

### 🎓 Student

Students can:

- View their assigned weekly academic schedule.
- Access daily routines and tasks.
- Track task timelines and statuses.
- Submit assignments and supporting files.
- Resubmit assignments when required.
- View teacher feedback and evaluation scores.
- Monitor their academic activities.

### 👨‍🏫 Teacher

Teachers can:

- Access their assigned academic responsibilities.
- Review student task submissions.
- Evaluate submitted assignments.
- Provide feedback to students.
- Track student work and performance.

### 🛡️ Head

The Head role provides centralized academic management capabilities.

- Create weekly academic templates.
- Assign weekly templates to students.
- Manage student and teacher workflows.
- Organize academic routines and schedules.
- Oversee academic activities and task progress.

## 📅 Weekly Routine System

One of the central features of Scholara is its weekly academic planning system.

The system determines a student's daily experience based on the assigned weekly academic plan.

| Day State | Description |
|---|---|
| OFF | No assignment exists for the day. |
| WORKING | An assignment exists, but no routine template is assigned. |
| SCHEDULED WORKING | An assignment and routine template are both available. |

### Routine Timeline

Scheduled tasks are organized into three timeline states:

- **PASSED** — The scheduled activity has already passed.
- **CURRENT** — The activity is currently in progress.
- **UPCOMING** — The activity is scheduled for later.

This structure helps students understand their daily responsibilities and follow their academic schedules.

## 📝 Assignment Workflow

Scholara provides an organized assignment lifecycle:

1. Weekly academic planning is created.
2. Academic templates are assigned to students.
3. Students access their daily tasks.
4. Students complete and submit their work.
5. Teachers review submitted assignments.
6. Teachers provide feedback and scores.
7. Students can resubmit work when required.

## 🖥️ Screenshots

<div align="center">

| Login Page | Student Dashboard |
|:---:|:---:|
| <img src="screenshots/login.png" width="400" alt="Login Page" /> | <img src="screenshots/student-dashboard.png" width="400" alt="Student Dashboard" /> |

| Teacher Dashboard | Head Dashboard |
|:---:|:---:|
| <img src="screenshots/teacher-dashboard.png" width="400" alt="Teacher Dashboard" /> | <img src="screenshots/head-dashboard.png" width="400" alt="Head Dashboard" /> |

| Weekly Routine | Assignment Management |
|:---:|:---:|
| <img src="screenshots/routine.png" width="400" alt="Weekly Routine" /> | <img src="screenshots/assignments.png" width="400" alt="Assignment Management" /> |

</div>

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework |
| React.js | User interface |
| TypeScript | Type-safe development |
| Prisma ORM | Database access and management |
| Database | Persistent application data |
| Tailwind-style CSS | Interface styling |
| Lucide Icons | Interface icons |
| Next.js Route Handlers | Backend API endpoints |

## 🏗️ Application Architecture

Scholara follows a full-stack application architecture.

| Layer | Responsibility |
|---|---|
| Frontend | Role-based dashboards and user interfaces |
| Backend | Application logic and API endpoints |
| Authentication | Session-based access and role management |
| Database | Persistent academic and user records |
| ORM | Database queries and data management |

The application uses role-based access for:

- `STUDENT`
- `TEACHER`
- `HEAD`

## 🚀 Getting Started

Follow these instructions to run Scholara locally.

### 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
```

### 2. Navigate to the Project

```bash
cd Scholar-a
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root and configure the required database and authentication environment variables.

Use the project's existing environment variable names and configuration.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Apply Database Migrations

```bash
npx prisma migrate deploy
```

For local development, use the migration workflow configured in your project.

### 7. Start the Development Server

```bash
npm run dev
```

Open your browser and visit:

```text
http://localhost:3000
```

## 🔑 Demo Accounts

The following demo accounts are available for exploring the role-based interfaces.

| Role | Username | Password |
|---|---|---|
| Student | `student` | `student123` |
| Teacher | `teacher` | `teacher123` |
| Head | `head` | `head123` |

**Note:** These are demonstration credentials. Do not use them for production accounts or real student information.

## 📂 Main Application Modules

| Module | Description |
|---|---|
| Authentication | User login and role-based sessions |
| Student Dashboard | Daily academic activities and tasks |
| Teacher Dashboard | Student work review and evaluation |
| Head Dashboard | Centralized academic management |
| Weekly Planning | Academic templates and assignments |
| Routine Management | Daily schedules and task timelines |
| Assignment System | Task submission and resubmission |
| Evaluation System | Teacher feedback and scoring |

## 🎯 Project Objectives

- Digitize and organize academic management workflows.
- Provide separate experiences for different educational roles.
- Simplify weekly planning and daily routine management.
- Improve assignment submission and evaluation workflows.
- Make student progress easier to monitor.
- Centralize academic activities in one platform.

## 🔮 Future Improvements

- Advanced academic analytics and reporting.
- Attendance management.
- Notifications and deadline reminders.
- Enhanced student performance reports.
- More detailed assignment history.
- Additional communication tools for students and teachers.
- Improved administrative reporting and management.

## 👨‍💻 Developer

**Saqlain Ahmad**

- GitHub: [@saqlainhub](https://github.com/saqlainhub)

---

<div align="center">

### 🎓 Scholara

**Organizing Education. Connecting Responsibilities. Tracking Progress.**

</div>
