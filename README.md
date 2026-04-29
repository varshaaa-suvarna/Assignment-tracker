# 📚 Assignment Workflow & Submission Tracking System

A full-stack web application for managing assignment creation, lifecycle, and student submissions — built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and a **vanilla HTML/CSS/JS** frontend.

---

## 🗂️ Project Structure

```
assignment-tracker/
├── backend/
│   ├── middleware/
│   │   └── logger.js          # Request logging middleware
│   ├── models/
│   │   ├── Assignment.js      # Assignment Mongoose schema
│   │   └── Submission.js      # Submission Mongoose schema
│   ├── routes/
│   │   ├── assignments.js     # Assignment CRUD routes
│   │   └── submissions.js     # Submission routes
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Express app entry point
└── frontend/
    ├── css/
    │   └── style.css
    ├── js/
    │   └── app.js
    └── index.html             # Main frontend UI
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on port 27017
- **npm**

### Step 1 — Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2 — Configure Environment
Edit `backend/.env` if needed:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/assignment_tracker
```

### Step 3 — Start MongoDB
Make sure MongoDB is running:
```bash
# On Linux/macOS
mongod

# On Windows (if installed as service)
net start MongoDB
```

### Step 4 — Start the Backend Server
```bash
cd backend
npm start
# OR for auto-reload during development:
npm run dev
```
You should see:
```
✅ Connected to MongoDB
🚀 Server running on http://localhost:5000
```

### Step 5 — Open the Frontend
Simply open `frontend/index.html` in your browser (double-click or drag into browser).

> **Note:** The frontend talks to `http://localhost:5000`. No additional server needed for the frontend.

---

## 🔌 API Endpoints

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assignments` | Create a new assignment |
| `GET` | `/api/assignments` | Get all assignments |
| `GET` | `/api/assignments?status=active` | Filter by status |
| `GET` | `/api/assignments?subject=Math` | Filter by subject |
| `GET` | `/api/assignments?sort=dueDate` | Sort by due date |
| `GET` | `/api/assignments?search=lab` | Search assignments |
| `GET` | `/api/assignments/:id` | Get specific assignment |
| `PUT` | `/api/assignments/:id` | Update an assignment |
| `DELETE` | `/api/assignments/:id` | Delete assignment + submissions |

### Submissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assignments/:id/submit` | Submit an assignment |
| `GET` | `/api/assignments/:id/submissions` | Get submissions for assignment |

---

## 📋 Request/Response Examples

### Create Assignment
```json
POST /api/assignments
{
  "title": "Data Structures Lab 1",
  "subject": "Computer Science",
  "description": "Implement a binary search tree with insert and search.",
  "dueDate": "2025-12-31T23:59:00",
  "instructor": "Dr. Sharma"
}
```

### Submit Assignment
```json
POST /api/assignments/:id/submit
{
  "studentName": "Ravi Kumar",
  "studentEmail": "ravi@example.com",
  "content": "Here is my implementation of the BST..."
}
```

---

## ✅ Features Implemented

- ✅ Assignment creation with automatic status (`active`/`closed`)
- ✅ Status auto-refreshed based on due date
- ✅ Submissions blocked after deadline
- ✅ Duplicate submission prevention (unique per email + assignment)
- ✅ Submission count per assignment
- ✅ Filter by status, subject, search
- ✅ Sort assignments by due date
- ✅ Request logging middleware
- ✅ Full CRUD operations
- ✅ Frontend dashboard with real-time data
- ✅ Inline edit and delete from UI
- ✅ View all submissions per assignment in modal

---

## 🧪 Testing with Postman

Import the `AssignmentTracker.postman_collection.json` file into Postman.

Set the base URL variable: `http://localhost:5000`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| API Testing | Postman |
