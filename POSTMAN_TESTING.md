# AlumHub Postman Testing

## 1) Base Setup

- Base URL: `http://localhost:5000/api`
- Header for protected routes:
  - `Authorization: Bearer <TOKEN>`
  - `Content-Type: application/json`

Recommended Postman environment variables:

- `baseUrl` = `http://localhost:5000/api`
- `collegeId` = `COLLEGE_1`
- `studentToken` = ``
- `alumniToken` = ``
- `adminToken` = ``
- `studentId` = ``
- `alumniId` = ``
- `requestId` = ``

---

## 2) Auth APIs

### 2.1 Signup (Student/Alumni)
`POST {{baseUrl}}/auth/signup`

```json
{
  "name": "Student One",
  "email": "student1@demo.com",
  "password": "Pass@123",
  "confirmPassword": "Pass@123",
  "role": "student",
  "prn": "STU1001",
  "collegeId": "{{collegeId}}"
}
```

For alumni signup, change:

```json
{
  "role": "alumni",
  "prn": "ALU1001"
}
```

### 2.2 Admin sample credentials
`GET {{baseUrl}}/auth/sample-credentials`

### 2.3 Admin login
`POST {{baseUrl}}/auth/login`

```json
{
  "portal": "admin",
  "email": "admin1@alumhub.demo",
  "password": "Admin@123",
  "collegeId": "{{collegeId}}"
}
```

Save `token` as `adminToken`.

### 2.4 Student login (PRN)
`POST {{baseUrl}}/auth/login`

```json
{
  "portal": "student",
  "identifier": "STU1001",
  "password": "Pass@123",
  "collegeId": "{{collegeId}}"
}
```

Save `token` as `studentToken`.

### 2.5 Alumni login (PRN)
`POST {{baseUrl}}/auth/login`

```json
{
  "portal": "alumni",
  "identifier": "ALU1001",
  "password": "Pass@123",
  "collegeId": "{{collegeId}}"
}
```

Save `token` as `alumniToken`.

---

## 3) Admin Verification Flow (Required)

New student/alumni are `verified: false`, so verify before login/testing.

### 3.1 List pending users
`GET {{baseUrl}}/admin/pending`

Header: `Authorization: Bearer {{adminToken}}`

Copy returned `_id` values.

### 3.2 Verify student/alumni
`PUT {{baseUrl}}/admin/verify/<USER_ID>`

Header: `Authorization: Bearer {{adminToken}}`

---

## 4) Mentorship Testing (Student -> Alumni)

### 4.1 Get verified alumni list
`GET {{baseUrl}}/alumni/verified`

Header: `Authorization: Bearer {{studentToken}}`

Pick one alumni `_id` and store as `alumniId`.

### 4.2 Send mentorship request as student
`POST {{baseUrl}}/mentorship/request`

Header: `Authorization: Bearer {{studentToken}}`

```json
{
  "alumniId": "{{alumniId}}",
  "message": "Need guidance for product-based placements."
}
```

Copy returned `request._id` as `requestId`.

### 4.3 Check student-side requests
`GET {{baseUrl}}/mentorship/my`

Header: `Authorization: Bearer {{studentToken}}`

### 4.4 Check alumni-side pending requests
`GET {{baseUrl}}/mentorship/my`

Header: `Authorization: Bearer {{alumniToken}}`

### 4.5 Accept request as alumni
`POST {{baseUrl}}/mentorship/{{requestId}}/accept`

Header: `Authorization: Bearer {{alumniToken}}`

```json
{
  "expertise": "DSA + Interview Prep",
  "availability": "Saturday 7 PM",
  "mode": "online",
  "termsAccepted": true
}
```

### 4.6 Reject request as alumni
`POST {{baseUrl}}/mentorship/{{requestId}}/reject`

Header: `Authorization: Bearer {{alumniToken}}`

```json
{
  "reason": "Unavailable this month"
}
```

---

## 5) Chat Testing

### 5.1 Send message
`POST {{baseUrl}}/chat`

Header: `Authorization: Bearer {{studentToken}}`

```json
{
  "receiverId": "{{alumniId}}",
  "text": "Hi sir, can we connect for guidance?",
  "clientId": "msg-001"
}
```

### 5.2 Get contacts
`GET {{baseUrl}}/chat/contacts`

Header: `Authorization: Bearer {{studentToken}}`

### 5.3 Get conversation
`GET {{baseUrl}}/chat/{{alumniId}}`

Header: `Authorization: Bearer {{studentToken}}`

Optional pagination:

`GET {{baseUrl}}/chat/{{alumniId}}?limit=20&before=2026-04-01T00:00:00.000Z`

### 5.4 Mark as read
`PATCH {{baseUrl}}/chat/read/{{alumniId}}`

Header: `Authorization: Bearer {{studentToken}}`

---

## 6) Events Testing

### 6.1 Create event (admin only)
`POST {{baseUrl}}/events`

Header: `Authorization: Bearer {{adminToken}}`

```json
{
  "title": "Alumni Connect 2026",
  "description": "Networking with alumni and students",
  "date": "2026-04-15",
  "time": "10:00 AM",
  "venue": "Main Auditorium",
  "registrationLink": "https://example.com/register",
  "status": "published"
}
```

### 6.2 List events
`GET {{baseUrl}}/events`

Header: any logged-in user token.

---

## 7) Discussions Testing

### 7.1 Create post
`POST {{baseUrl}}/discussions`

Header: any logged-in user token

```json
{
  "content": "How should I prepare for internships?"
}
```

### 7.2 Reply post
`POST {{baseUrl}}/discussions`

```json
{
  "content": "Start with DSA + projects.",
  "parentId": "<DISCUSSION_ID>"
}
```

### 7.3 Fetch all
`GET {{baseUrl}}/discussions`

### 7.4 Fetch mine
`GET {{baseUrl}}/discussions/my`

---

## 8) If You Still See "No Mentorship Requests"

1. Ensure student and alumni are in the same `collegeId`.
2. Ensure alumni is `verified: true` and not blocked.
3. Ensure you are logging in with correct portal:
   - student -> `portal: student`
   - alumni -> `portal: alumni`
4. Check student request creation response is `201`.
5. Check directly in Postman:
   - `GET /mentorship/my` with student token
   - `GET /mentorship/my` with alumni token
6. Restart backend after changes:
   - `cd alumni-backend`
   - `npm run dev`

