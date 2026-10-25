# CampusConnect (MERN + Socket.io)
## Install once
Node.js 18+, VS Code, Git. Optional: MongoDB Compass, Postman.
## Run (2 terminals)
Terminal 1: cd server && cp .env.example .env && npm install && npm run seed && npm run dev
Terminal 2: cd client && cp .env.example .env && npm install && npm run dev   (opens http://localhost:5173)
Database: empty MONGO_URI = embedded local MongoDB (first run downloads it). Atlas: paste your connection string.
## Email rules (sign up and login)
Student: student101@college.edu (student + ID, choose your department when signing up)
Faculty: facultycse1@college.edu (faculty + department + number)   HOD: hodcse@college.edu (hod + department, one per department)
Admin: admin@college.edu (sign up needs ADMIN_CODE from .env). Department of faculty and HOD comes from the email.
## Demo logins (after npm run seed)
admin@college.edu / Admin@123 | hodcse@college.edu / Hod@1234 | facultycse1@college.edu / Faculty@123 | student101@college.edu / Student@123
## Attendance by QR
Student registers (form) and gets a QR ticket (also under "QR ticket" on the event card). Faculty/HOD/Admin open Scan QR, start the camera (needs localhost or https) or type the ticket code. Attendance is marked and the student is notified.
## Images
Posters can upload up to 4 images per event (slideshow on the card). Without uploads a themed banner is shown based on the title/category (tech, music, sports, science, talk, or type).
