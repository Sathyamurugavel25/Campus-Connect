# 🚀 CampusConnect – College Community Platform

**CampusConnect** is a full-stack web application developed during the **24-Hour MongoDB Tech – ODYSSEY Hackathon at KIOT College**.

It provides a centralized platform that connects students, faculty, Heads of Departments (HODs), and administrators, making college communication and activity management easier and more organized.

## 📌 Problem Statement

College information is often scattered across WhatsApp groups, social media, emails, and notice boards. Students may miss important announcements, events, club activities, and opportunities.

CampusConnect addresses this problem by bringing essential college community activities together on a single platform.

## 💡 Key Features

- 👨‍🎓 **Student Dashboard** – Manage profiles, discover clubs, register for events, and access announcements.
- 👩‍🏫 **Faculty Dashboard** – Create and manage clubs, events, announcements, and learning resources.
- 🏢 **HOD Dashboard** – Review and approve faculty-created clubs, events, and important announcements.
- 🛡️ **Admin Dashboard** – Manage users, roles, platform content, and overall activities.
- 🎉 **Club Management** – Discover and participate in college clubs.
- 📅 **Event Management** – Explore events and manage registrations.
- 📢 **Announcements** – Access important college updates in one place.
- 💬 **Community Discussions** – Encourage interaction among students and faculty.
- 🔔 **Notifications** – Keep users informed about relevant updates.
- 📊 **Student Engagement** – Support activity tracking and participation monitoring.

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Axios
- React Router

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MongoDB
- Mongoose
- MongoDB Atlas

### Development & Collaboration Tools
- Visual Studio Code
- npm
- Postman
- MongoDB Compass
- Git
- GitHub

## 🏗️ System Architecture

```text
                 User
                  |
                  v
             React.js UI
                  |
                  v
                Axios
                  |
                  v
          Express.js REST APIs
                  |
                  v
              Node.js
                  |
                  v
              Mongoose
                  |
                  v
               MongoDB
```

## 🔄 Application Workflow

1. Users log in and access dashboards based on their roles.
2. Faculty create clubs, events, and announcements.
3. HODs review and approve content requiring approval.
4. Approved content becomes available to relevant students.
5. Students explore clubs, register for events, and access announcements.
6. Data is stored and retrieved through backend APIs connected to MongoDB.
7. Admins manage users and monitor platform activities.

## 👩‍💻 My Contribution

**Role: Frontend Developer**

- Developed user interface components using React.js.
- Worked on dashboard layouts and role-based pages.
- Created reusable components for a consistent user experience.
- Worked on frontend navigation and interactive UI elements.
- Contributed to connecting frontend components with backend APIs using Axios.

## 🏆 Hackathon Details

- **Event:** MongoDB Tech – ODYSSEY Hackathon
- **Duration:** 24 Hours
- **Venue:** KIOT College
- **Project:** CampusConnect – College Community Platform
- **Technology:** MERN Stack

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB Atlas account or a MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

### 2. Navigate to the Project

```bash
cd CampusConnect
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
```

### 4. Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

### 5. Configure Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Replace the placeholder values with your actual configuration. Never commit your `.env` file or expose database credentials and secret keys.

### 6. Run the Application

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

**Note:** These commands assume the relevant scripts are configured in each `package.json`. If your project uses different scripts or ports, update the commands accordingly.

## 🔮 Future Enhancements

- Real-time notifications.
- Advanced event recommendations.
- Enhanced analytics dashboards.
- Improved mobile responsiveness.
- Additional student collaboration features.

## 👥 Team Project

Developed collaboratively as part of the **24-Hour MongoDB Tech – ODYSSEY Hackathon at KIOT College**.

## 🙌 Acknowledgements

Thanks to the hackathon organizers, mentors, and teammates for providing an opportunity to learn, collaborate, and develop CampusConnect.

---

⭐ If you find this project interesting, consider giving the repository a star!
