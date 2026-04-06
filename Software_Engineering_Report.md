# Software Engineering & Modelling Report
# INDEX

## Chapter 1: Introduction
### 1.1 Title
**AlumHub – Alumni Networking and Mentorship Platform**

### 1.2 Objective
The primary objective of AlumHub is to create a unified platform that bridges the gap between current students and alumni. It aims to facilitate seamless communication, offer structured mentorship programs, and provide a secure environment for knowledge sharing, career guidance, and networking.

### 1.3 Features of Project
1. **Secure Dual-Portal Authentication:** Separate login flows for Students, Alumni, and Admin using JWT tokens.
2. **Admin Verification System:** A robust dashboard for administrators to verify and approve student and alumni profiles before they gain access.
3. **Structured Mentorship Module:** Students can browse verified alumni and send formal mentorship requests specifying their needs.
4. **Interactive Mentorship Management:** Alumni can view, accept, or reject incoming mentorship requests with customizable availability.
5. **Real-time Communication:** Integrated One-on-One chat system (powered by Socket.io) for seamless text-based interactions.
6. **Community Discussion Forums:** Ability to create discussion topics, post queries, and reply to community posts.
7. **Event Management System:** Admins can create and manage networking and campus events for students and alumni.
8. **Responsive User Interface:** A modern frontend built with React.js and TailwindCSS for cross-device compatibility.
9. **Automated Communications:** Email integration (using Nodemailer) for notifications and alerts. 
10. **Role-Based Access Control (RBAC):** Strict resource access policies protecting endpoints based on user roles and verification status.

### 1.4 Suitable software development model for your system
**Agile Methodology (Scrum)**
*Justification:* Since the project uses the MERN stack (MongoDB, Express, React, Node.js) with independent frontend and backend modules, an Agile approach allows for iterative development. It enables the team to build the API first, test it via tools like Postman, and concurrently develop the UI, adapting to changes in UI/UX requirements seamlessly.

---

## Chapter 2: SRS of system
**1. Purpose:** To define the system requirements for AlumHub, highlighting functional and non-functional needs.
**2. Scope:** The system encompasses a web application accessible by Students, Alumni, and Admins from any standard web browser.
**3. Functional Requirements:**
- The system must authenticate users via email/PRN and password.
- Administrators must be able to view pending users and verify them.
- Students must be able to request mentorship from Alumni.
- Users must be able to exchange messages in real-time.
- Users must be able to create and respond to discussion threads.
**4. Non-Functional Requirements:**
- **Performance:** Real-time chat messages should be delivered with minimal latency (< 2 seconds).
- **Security:** Passwords must be hashed (Bcrypt) and API requests must be secured with Bearer Tokens.
- **Reliability:** The system should handle concurrent student connections efficiently through asynchronous Node.js.

---

## Chapter 3: Design and Architecture

### 2.1 Data Center Architecture
The system follows a **Three-Tier Architecture**:
1. **Presentation Tier:** Client-side application built on React.js handling UI rendering and state management.
2. **Application Tier:** Node.js & Express.js server that processes business logic, handles WebSocket events, and serves RESTful APIs.
3. **Data Tier:** MongoDB database managing the persistence of Users, Messages, Events, and Discussions.

### 2.2 Data Flow Architecture
*Note: You can draw Data Flow Diagrams (DFD) based on this logic.*
- **Level 0 DFD:** End users (Student/Alumni/Admin) interact with the AlumHub System (central process), which fetches/stores data in the AlumHub Database.
- **Level 1 DFD:** Breaks down into sub-processes: Authentication Flow, Mentorship Request Flow, Chat Data Stream, and Admin Dashboard processing. 

### 2.3 Call and Return Architecture
The system uses a **RESTful Client-Server synchronous Call and Return Architecture** for majority operations:
1. Client makes an HTTP Request (GET/POST/PUT) with JSON payload.
2. Express Router receives the call and delegates to a Controller.
3. Controller interacts with Mongoose Models to perform DB operations.
4. Response is returned to the client as JSON with appropriate HTTP status codes (200, 201, 400, etc.).

---

## Chapter 4: UML Diagram
*(Textual description to help you draw the visual diagrams)*

### 3.1 Use Case Diagram
- **Actors:** Admin, Student, Alumni.
- **Use Cases:** Register, Login, Verify User (Admin), Send Mentorship Request (Student), Accept/Reject Request (Alumni), Send Message (Student/Alumni), Create Event (Admin), Create Post (Student/Alumni).

### 3.2 Class Diagram
- **User Class:** Attributes (id, name, email, prn, role, isVerified).
- **Mentorship Class:** Attributes (requestId, studentId, alumniId, status, message).
- **Message Class:** Attributes (id, senderId, receiverId, text, timestamp).
- **Event Class:** Attributes (eventId, title, description, date, venue).

### 3.3 Sequence Diagram
**(Mentorship Flow)**
1. Student -> Frontend: Click 'Request Mentorship'
2. Frontend -> Auth Middleware: Validate token
3. Middleware -> MentorshipController: Process Request
4. Controller -> Database: Save Mentorship Document
5. Database -> Controller: Return Success
6. Controller -> Frontend: Return 201 Created

### 3.4 Collaboration Diagram
Similar to sequence diagram but focused on the object links (Student Object -> Mentorship Controller Object -> Database Object). 

### 3.5 Activity Diagram
**(Login Process)**
Start -> Enter Credentials -> Validate Input -> User Exists? -> (No: Error Message) -> (Yes: Match Password?) -> (No: Error Message) -> (Yes: Generate JWT) -> Navigate to Dashboard -> End.

### 3.6 Component Diagram
- **Components:** Web Client (React), API Gateway (Express Routing), Controllers Hub, Data Models (Mongoose ORM).
- **Interfaces:** REST API interface, Socket.io interface.

### 3.7 Deployment Diagram
- **Nodes:** Client Browser Node, Web Server Node (Node.js runtime environment), Database Server Node (MongoDB API Server).

---

## Chapter 5: Software Metrics

### Software cost estimation techniques
Cost estimation involves predicting the resources and effort needed to develop the software. Common methods include Expert Judgment, Algorithmic Models (COCOMO), and Function Point Analysis.

### COCOMO and Putnam model
- **COCOMO (Constructive Cost Model):** Estimates effort based on the size of the software (KLOC - Kilo Lines of Code). It has three modes: Organic, Semi-detached, and Embedded. 
- **Putnam Model:** An empirical model that helps in predicting the time and effort required for software based on Rayleigh distribution curve. 

### Apply any of above model to calculate cost of your system
*(Sample Calculation using Basic COCOMO - Organic Mode)*
- Estimated Size of AlumHub (Frontend + Backend): **~5 KLOC**
- Effort `E = a * (KLOC)^b` (where a=2.4, b=1.05 for Organic)
- Effort E = 2.4 * (5)^1.05 ≈ `12.98 Person-Months`
- Development Time `D = c * (E)^d` (where c=2.5, d=0.38)
- Time D = 2.5 * (12.98)^0.38 ≈ `6.61 Months`
- Total Cost = Person-Months × Average Salary per developer. 
*(You can adjust these numbers manually based on your actual team size and project length!)*

---

## Chapter 6: Software Testing

### Black Box testing of any GUI
- **Test Case 1 (Login Form):** Enter valid PRN and Password. *Expected:* Redirect to Dashboard. *Actual:* Redirected successfully. Status: **PASS**.
- **Test Case 2 (Mentorship Form):** Submit request without a message. *Expected:* Required field validation error. *Actual:* Error displayed. Status: **PASS**.

### White box testing of any running code
- **Test Case (Auth Route Validation):** Test the `/auth/signup` logic block.
  - *Input:* `{ prn: "ALU1001", role: "alumni" }`
  - *Expected Outcome:* Controller validates PRN presence and returns 201 Created after inserting into the database, generating a Bcrypt hash for password.

### Running Code
To run the server and frontend locally:
```bash
# Backend Execution
cd alumni-backend
npm install
npm run dev
# Server running concurrently on http://localhost:5000

# Frontend Execution
cd alumni-frontend
npm install
npm run dev
# Client running concurrently on http://localhost:5173
```

### Screenshots of input and output window
**[Unknown - Please Add Manually]** 
*Please attach screenshots of your Login Page, User Dashboard, Chat Interface, Postman API Testing Results, and Terminal outputs here.*
