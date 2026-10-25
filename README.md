# CampusConnect (KIOT)

A full-stack MERN college community platform that connects **Students, Faculty, HODs and Admins** in one place. It covers clubs, events, hackathons, workshops, internships, announcements, notifications, QR attendance and analytics.

## Features

| Role | What they can do |
|---|---|
| **Student** | Sign up with a student ID email, edit profile, join or leave clubs, register for events, hackathons and workshops, apply for internships, get a QR ticket, view announcements, get live notifications, rate attended events, track participation |
| **Faculty** | Create and manage clubs, events, hackathons, workshops, internships and announcements with up to 4 images each, see registrations and club members, mark attendance by QR scan, export registrations to CSV. Clubs, events and important announcements go to the HOD for approval |
| **HOD** | Approve or reject faculty posts for the department (with a reason), post announcements, scan QR, view department analytics and people |
| **Admin** | Manage users and roles, create staff accounts, post announcements, approve anything, send broadcast notifications, view overall analytics |

Other highlights: real-time updates (Socket.io), search and filters, role-based menus and colours, default themed banners when no image is uploaded, student data privacy (students never see other students' registrations).

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Axios, socket.io-client, qrcode, html5-qrcode
- **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, dotenv, CORS, Multer, Socket.io
- **Database:** MongoDB (Atlas, local, or the built-in embedded MongoDB)
- **Tools:** VS Code, npm, MongoDB Atlas, MongoDB Compass, Postman, Git and GitHub

## Folder Structure

```
campusconnect/
├── server/
│   ├── server.js        # REST API, auth, role checks, Socket.io
│   ├── models.js        # Mongoose models
│   ├── db.js            # MongoDB connection (Atlas or embedded)
│   ├── seed.js          # Demo users and sample data
│   ├── uploads/         # Uploaded images and resumes (created automatically)
│   └── .env.example
└── client/
    ├── public/          # college.jpg and college-logo.png go here
    └── src/             # App.jsx, api.js, index.css, main.jsx
```

## Requirements

- Node.js 18 or newer (https://nodejs.org)
- Git and VS Code
- Optional: MongoDB Compass, Postman

## Setup and Run

Use two terminals.

**Terminal 1: backend**
```bash
cd server
cp .env.example .env        # on Windows: copy .env.example .env
npm install
npm run seed                # optional: demo users and sample data
npm run dev
```

**Terminal 2: frontend**
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

### Database options
- **Zero setup:** leave `MONGO_URI` empty. An embedded MongoDB starts automatically and saves data in `server/data`. The first run downloads MongoDB once.
- **MongoDB Atlas:** paste your connection string into `MONGO_URI`, and allow your IP in Atlas under Network Access.
- **Local MongoDB:** `MONGO_URI=mongodb://127.0.0.1:27017/campusconnect`

## Environment Variables

**server/.env**

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string (empty = embedded database) |
| `JWT_SECRET` | Secret used to sign login tokens. Use a long random value |
| `CLIENT_URL` | Frontend address for CORS (http://localhost:5173) |
| `COLLEGE_DOMAIN` | Email domain for sign up (default `college.edu`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created on first start |
| `ADMIN_CODE` | Code required to sign up as Admin from the website. Change it |
| `REQUIRE_APPROVAL` | `true` = faculty clubs, events and important announcements wait for HOD approval. `false` = go live instantly |

**client/.env**

| Variable | Purpose |
|---|---|
| `VITE_API` | API address, e.g. `http://localhost:5000/api` |

## Sign Up Rules (email format)

| Role | Email format | Example |
|---|---|---|
| Student | `student` + ID | `student101@college.edu` |
| Faculty | `faculty` + department + number | `facultycse1@college.edu` |
| HOD | `hod` + department (one per department) | `hodcse@college.edu` |
| Admin | `admin` (needs `ADMIN_CODE`) | `admin@college.edu` |

The department of faculty and HOD is read from the email. Students choose their department during sign up.

## Demo Logins (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@college.edu | Admin@123 |
| HOD | hodcse@college.edu | Hod@1234 |
| Faculty | facultycse1@college.edu | Faculty@123 |
| Student | student101@college.edu | Student@123 |

## How It Works

**Workflow:** Login → role-based dashboard → React → Axios → Express REST API → JWT authentication and role checks → MongoDB → response → live dashboard updates and notifications.

**Approval flow:** A faculty member posts a club, event or important announcement. It is marked *pending* and the HOD of the same department is notified. The HOD approves or rejects it with a note, and the faculty member is notified. After approval, everyone sees the post. HOD and Admin posts go live immediately.

**Registration and QR attendance:**
1. A student opens an event and fills in the registration form. Name, department and email are filled in automatically.
2. The student gets a QR ticket with a short code. It is also under the **QR ticket** button on the event card.
3. Faculty, HOD or Admin open **Scan QR**, start the camera, and scan the ticket. The student is marked present and gets a notification.
4. If the camera is not available, type the ticket code instead.

The camera works only on `localhost` or `https`.

**Images:** Posters can upload up to 4 images per event, shown as a slideshow. Without uploads, a themed banner is shown based on the title and category (tech, music, sports, science, talks, or the type of post).

**College branding:** put your photo at `client/public/college.jpg` and an optional logo at `client/public/college-logo.png`. They appear on the login page.

## API Overview

All routes start with `/api` and, except login and register, need the header `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me`, `PUT /auth/password` |
| Users | `GET /users`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id` |
| Clubs | `GET/POST /clubs`, `PUT/DELETE /clubs/:id`, `PATCH /clubs/:id/review`, `POST /clubs/:id/join`, `GET /clubs/:id/members` |
| Events (also hackathons, workshops, internships) | `GET/POST /events?type=...`, `PUT/DELETE /events/:id`, `PATCH /events/:id/review`, `POST /events/:id/register`, `GET /events/:id/registrations`, `PATCH /events/:id/attendance`, `GET /events/:id/export`, `POST /events/:id/rate` |
| Announcements | `GET/POST /announcements`, `PUT/DELETE /announcements/:id`, `PATCH /announcements/:id/review` |
| Attendance | `POST /checkin` |
| Notifications | `GET /notifications`, `PATCH /notifications/read`, `POST /notifications/broadcast` |
| Reports | `GET /analytics`, `GET /participation` |

## Git Workflow

```bash
git init
git checkout -b feature/<your-module>   # e.g. feature/auth, feature/events
git add .
git commit -m "Describe your change"
git push origin feature/<your-module>
```

Open a pull request into `main`. Never commit `.env`, `node_modules`, `uploads` or `data` (they are in `.gitignore`).

## Troubleshooting

| Problem | Fix |
|---|---|
| `EADDRINUSE: port 5000` | Another copy of the server is running. Stop it, or set a different `PORT` in `server/.env` and `VITE_API` in `client/.env`, then restart both |
| Camera does not start | Allow camera access and use `localhost` or `https`. Otherwise type the ticket code |
| Login says "This is a ... account" | You picked the wrong tab. The page switches to the correct one, so press Log in again |
| Database changed or demo emails missing | Delete `server/data` and run `npm run seed` again |
| Frontend cannot reach the API | Check `VITE_API` and `CLIENT_URL`, and make sure the server is running |

## Security Notes

- Change `JWT_SECRET` and `ADMIN_CODE` before sharing the site.
- Faculty and HOD sign up follows the email format without a code. Anyone who knows the format can create such an account, so add an admin approval step before using it on a public site.
- Passwords are stored hashed with bcrypt.

## Team

Add your team members and their modules here.
