# AlumHub

AlumHub is a college-scoped alumni networking platform built with a React frontend and Node.js/Express backend. It connects students, alumni, and admins through mentorship, private chat, community discussions, events, notifications, and feedback workflows.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Socket.IO Client, Tailwind CSS
- Backend: Node.js, Express, Mongoose, JWT, Socket.IO, Nodemailer
- Database: MongoDB

## Core Features

- Role-based portals: `student`, `alumni`, `admin`
- Signup with verification flow
- Admin approval for student/alumni accounts
- Student and alumni profile management
- Verified alumni directory
- Mentorship request lifecycle (create, accept, reject, track)
- Real-time private messaging with delivery/read states
- Student chat-request permission flow
- Community discussions with replies, likes, and upvotes
- Admin moderation and access controls
- Events management
- In-app notifications
- Feedback/complaint/suggestion/bug reporting
- Dashboard analytics

## Project Structure

```text
alumHub/
  alumni-backend/
    controllers/
    models/
    routes/
    middleware/
    socket/
    utils/
    server.js
  alumni-frontend/
    src/
      pages/
      components/
      context/
      utils/
    index.html
```

## Setup

## 1) Clone and install

```bash
git clone <your-repo-url>
cd alumHub
cd alumni-backend && npm install
cd ../alumni-frontend && npm install
```

## 2) Configure backend environment

Create `alumni-backend/.env` and set:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/alumniDB
JWT_SECRET=your_jwt_secret
CLIENT_ORIGINS=https://alumhub.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

Add mail credentials if email sending is enabled in your environment.
For Railway/production, use SMTP settings (recommended for reliable OTP delivery):

```env
EMAIL_USER=your_sender_email@gmail.com
EMAIL_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
EMAIL_TIMEOUT_MS=30000
EMAIL_SEND_TIMEOUT_MS=35000
```

## 3) Run backend

```bash
cd alumni-backend
npm run dev
```

## 4) Run frontend

```bash
cd alumni-frontend
npm run dev
```

Frontend default URL: `http://localhost:5173`  
Frontend default backend: `https://alumhub.up.railway.app/api`

To switch frontend to local backend while developing, create `alumni-frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Document Upload Service Setup (Cloudinary)

This project now uses Cloudinary unsigned uploads for:
- Signup verification PDFs (resume, fee receipt, student ID)
- Optional profile image upload

### A) Create Cloudinary configuration

1. Create a Cloudinary account and open your dashboard.
2. Go to **Settings -> Upload -> Upload presets**.
3. Create an unsigned preset (for example `alumhub_unsigned`).
4. Restrict this preset to your frontend origins (`http://localhost:5173`).
5. In the preset, keep resource types enabled for:
   - `raw` (for PDF files)
   - `image` (for profile images)

### B) Add frontend environment variables

Create `alumni-frontend/.env` with:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

### C) PDF policy

- Only PDF files are accepted for verification documents.
- Alumni must upload at least one: Resume PDF or Last Year Fee Receipt PDF.
- Students must upload at least one: Recent Fee Receipt PDF or Student ID Card PDF.

## Main API Modules

- `/api/auth` - signup, login, verification, auth me
- `/api/admin` - verification, moderation, analytics, feedback handling
- `/api/user` - profile fetch/update and public profile visit
- `/api/alumni` - verified alumni listing
- `/api/mentorship` - mentorship requests
- `/api/chat` - messaging and chat requests
- `/api/discussions` - posts, replies, reactions
- `/api/events` - event CRUD
- `/api/notifications` - notification list/read
- `/api/dashboard` - summary metrics and news

## Security Notes

- JWT authentication on protected APIs
- Role-based authorization middleware
- CORS allowlist via `CLIENT_ORIGINS`
- Helmet security headers
- Request rate limiting on auth and API routes
- College-level isolation using `collegeId`

## Testing

- Postman collection flow is documented in:
  - `POSTMAN_TESTING.md`

## Future Improvements

- Automated unit and integration tests
- CI pipeline for lint/test/build
- Rich file/media messaging support
- Advanced analytics and reporting exports

## License

`[[ADD LICENSE HERE]]`
