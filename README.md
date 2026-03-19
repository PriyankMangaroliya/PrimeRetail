# 🏬 PrimeRetail - Retail & Inventory Management System

PrimeRetail is a **full-stack Retail & Inventory Management System** designed to manage store operations, inventory tracking, billing, and reporting.

It is built using modern web technologies and follows **clean architecture and modular backend design**.

---

# ⚙️ Tech Stack

### Backend

* Node.js
* Express.js
* PostgreSQL
* pg (PostgreSQL client)
* JWT Authentication
* Joi / Express Validator

### Frontend

* React (Vite)
* Axios
* Context API
* Role-Based Routing

---

# 📦 Project Structure

```
PrimeRetail/
│
├── frontend/        # React Application (UI Layer)
├── backend/         # Node.js + Express REST API
├── README.md        # Project Documentation
└── .gitignore
```

---

# 🚀 Features

## 🔐 Authentication & Authorization

* JWT-based authentication
* Role-based access control (RBAC)
* Protected API routes
* Secure user session handling

---

# 👥 Roles Supported

The system supports multiple roles for access control:

* Super Admin
* Store Owner
* Manager
* Cashier
* Inventory Staff
* Warehouse Staff

Each role has different permissions inside the system.

---

# 🖥 Backend Architecture

Location: `backend/src/`

The backend follows a **layered architecture** to maintain scalability and code maintainability.

### 🔹 Backend Tech Stack

* Node.js
* Express.js
* PostgreSQL
* pg (PostgreSQL driver)
* JWT Authentication
* Joi / Express Validator

---

# 📁 Backend Folder Structure

```
backend/
│
├── src/
│   ├── config/          # Database & environment configs
│   ├── models/          # Database queries (table-wise models)
│   ├── controllers/     # Request & response handling
│   ├── services/        # Business logic layer
│   ├── routes/          # API route definitions
│   ├── middlewares/     # Authentication & validation middleware
│   ├── utils/           # Helper utilities
│   ├── app.js           # Express application configuration
│   └── server.js        # Application entry point
│
├── .env
├── package.json
└── package-lock.json
```

---

# 🔹 Backend Development Rules

### ✅ Controllers

Controllers are responsible for handling **HTTP request and response**.

Responsibilities:

* Receive API request
* Validate request
* Call service layer
* Send API response

Controllers should **not contain business logic or database queries**.

---

### ✅ Services

The **service layer contains business logic**.

Responsibilities:

* Handle complex operations
* Perform calculations
* Combine multiple database calls
* Reusable business logic


---

### ✅ Models

Models interact directly with the **PostgreSQL database**.

Rules:

* One file per database table
* Contains SQL queries
* No business logic
* Only database interaction

---

### ✅ Routes

Routes map API endpoints to controllers.

Structure:

```
Route → Middleware → Controller
```

All routes are loaded centrally in:

```
routes/index.jsx
```

Example:

```
POST /api/auth/login
GET /api/users
POST /api/invoices
```

---

### ✅ Middleware

Middleware handles **security and validation**.

Examples:

* JWT Authentication
* Role Authorization
* Request Validation
* Global Error Handling

---

# 🗄 Database (PostgreSQL)

PrimeRetail uses **PostgreSQL relational database**.

### Database Structure

* 16 Tables
* Foreign Key relationships
* Normalized schema
* Transaction support for billing operations

### Main Tables

```
role_master
user_master
store_master
warehouse_master
tax_master
store_taxes
category_master
product_master
stock_master
stock_transactions
customer_master
discount_master
invoice_master
invoice_items
payment_method_master
payment_master
```

---

# 🎨 Frontend Architecture

Location: `frontend/src/`

### 🔹 Frontend Tech Stack

* React (Vite)
* Axios
* Context API
* Role-based routing

---

# 📁 Frontend Folder Structure

```
frontend/
│
├── public/
├── src/
│   ├── api/          # Axios API requests
│   ├── assets/       # Images & static files
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page-level components
│   ├── routes/       # React router configuration
│   ├── context/      # Global authentication state
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Helper utilities
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── package.json
└── vite.config.js
```

---

# 🔹 Frontend Development Rules

### ✅ Pages

Pages handle:

* UI screens
* API calls
* Form handling

Pages should **not contain reusable UI components**.

---

### ✅ Components

Components are **pure reusable UI elements**.

Examples:

```
Button
InputField
Modal
Table
Navbar
Sidebar
```

Components **must not contain business logic**.

---

### ✅ API Folder

Handles **Axios API requests** only.

Example:

```
authApi.js
userApi.js
productApi.js
invoiceApi.js
```

---

### ✅ Context

Global application state.

Stores:

* Authentication token
* Logged-in user data
* User role

---

### ✅ Routes

Two route guards:

```
PrivateRoute → Check if logged in
RoleRoute → Check user role
```

Example:

```
<RoleRoute allowedRoles={['Admin']} />
```

---

# 🔥 Role-Based Routing

Example route structure:

```
/admin/*
/owner/*
/manager/*
/cashier/*
/inventory/*
/warehouse/*
```

---

# ⚙️ Environment Variables

## Backend `.env`

```
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=primeretail
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:5173
```

---

## Frontend `.env`

```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

# 🛠 Installation Guide

## 1️⃣ Clone Repository

```
git clone https://github.com/your-username/PrimeRetail.git
cd PrimeRetail
```

---

# 2️⃣ Backend Setup

```
cd backend
npm install
npm run dev
```

Backend server runs on:

```
http://localhost:5000
```

---

# 3️⃣ Frontend Setup

```
cd frontend
npm install
npm run dev
```

Frontend application runs on:

```
http://localhost:5173
```

---

# 📘 API Structure

Base URL:

```
/api
```

Example Endpoints:

| Method | Endpoint        | Description      |
| ------ | --------------- | ---------------- |
| POST   | /api/auth/login | User login       |
| GET    | /api/users      | Get users        |
| POST   | /api/invoices   | Create invoice   |
| GET    | /api/products   | Get product list |
| GET    | /api/reports    | Generate reports |

---

# 🧱 Core Modules

PrimeRetail includes the following modules:

* Authentication
* User & Role Management
* Store Management
* Warehouse Management
* Inventory Management
* Billing & Invoicing
* Payment Processing
* Sales Reports
* System Settings

---

# 🔐 Security

The system includes multiple security layers:

* JWT Authentication
* Role-Based Authorization
* Input Validation
* Centralized Error Handling
* Secure API access

---

# 📌 Deployment Notes

### Backend

Recommended deployment options:

* PM2
* Docker
* Nginx Reverse Proxy

Database deployment:

* PostgreSQL (Cloud or Managed Service)

---

### Frontend

Build project:

```
npm run build
```

Deploy build folder to:

* Vercel
* Netlify
* Nginx server

---

# 📄 .gitignore

```
node_modules/
.env
dist/
build/
logs/
```

---

# 🎯 Final Architecture Rules

## Backend

```
Routes
 → Middleware
   → Controller
     → Service
       → Model
         → PostgreSQL
```

---

## Frontend

```
Pages
 → Components
 → API calls
 → Context
 → Routes
```

---

# 👨‍💻 Author

**PrimeRetail Development System**

Retail & Inventory Management Platform

---

# 📜 License

This project is for **educational and commercial development purposes**.

---

# 🔥 PrimeRetail

✔ Clean Architecture
✔ Modular Code
✔ PostgreSQL Database
✔ Role-Based Security
✔ Scalable System Design

**PrimeRetail – Smart Retail Management**
