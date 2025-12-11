# MedReserve Backend API

A robust Node.js/Express REST API for managing healthcare appointment bookings with PostgreSQL database, transaction-based concurrency control, and automatic booking expiry.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [Deployment](#deployment)
- [Testing](#testing)

## 🎯 Project Overview

MedReserve is a healthcare appointment booking system that allows patients to book appointments with doctors. The backend provides a RESTful API with:

- **Concurrency Control**: Transaction-based locking prevents double-booking
- **Automatic Expiry**: Background job expires PENDING bookings after 2 minutes
- **Admin Management**: Endpoints for creating doctors and appointment slots
- **Public API**: Patient-facing endpoints for browsing and booking

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL 14+
- **ORM**: Native pg (node-postgres)
- **Environment**: dotenv
- **CORS**: cors middleware

## ✨ Features

### Core Features

1. **Doctor Management**
   - List all doctors
   - Create new doctors (admin)
   - View doctor specializations

2. **Slot Management**
   - Create appointment slots (admin)
   - View available slots for a doctor
   - Automatic slot availability tracking

3. **Booking System**
   - Book appointments with transaction safety
   - Prevent double-booking using database constraints
   - Automatic expiry of PENDING bookings (2-minute timeout)
   - Booking status tracking (PENDING → CONFIRMED/FAILED)

4. **Concurrency Control**
   - SQL transactions with `FOR UPDATE` locking
   - Unique constraint on `booking_slots.slot_id`
   - Atomic booking confirmation

5. **Background Jobs**
   - Automatic booking expiry job (runs every 30 seconds)
   - Marks expired PENDING bookings as FAILED

## 📚 API Documentation

### Base URL

- **Local**: `http://localhost:4000/api`
- **Production**: `https://your-render-app.onrender.com/api`

### Public Endpoints

#### Get All Doctors

```http
GET /api/doctors
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Dr. John Smith",
    "specialization": "Cardiology",
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Get Doctor Slots

```http
GET /api/doctors/:id/slots
```

**Parameters:**
- `id` (path): Doctor ID

**Response:**
```json
[
  {
    "id": 1,
    "doctor_id": 1,
    "start_time": "2024-01-20T10:00:00.000Z",
    "duration_minutes": 30,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Book Appointment

```http
POST /api/slots/:slotId/book
```

**Parameters:**
- `slotId` (path): Slot ID to book

**Request Body:**
```json
{
  "patient_name": "Jane Doe",
  "patient_email": "jane@example.com"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "slot_id": 1,
  "patient_name": "Jane Doe",
  "patient_email": "jane@example.com",
  "status": "CONFIRMED",
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses:**
- `400`: Missing required fields
- `404`: Slot not found
- `409`: Slot already booked

### Admin Endpoints

#### Create Doctor

```http
POST /api/admin/doctors
```

**Request Body:**
```json
{
  "name": "Dr. John Smith",
  "specialization": "Cardiology"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "Dr. John Smith",
  "specialization": "Cardiology",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

#### List All Doctors (Admin)

```http
GET /api/admin/doctors
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Dr. John Smith",
    "specialization": "Cardiology",
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Create Slot

```http
POST /api/admin/slots
```

**Request Body:**
```json
{
  "doctor_id": 1,
  "start_time": "2024-01-20T10:00:00.000Z",
  "duration_minutes": 30
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "doctor_id": 1,
  "start_time": "2024-01-20T10:00:00.000Z",
  "duration_minutes": 30,
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

#### Get Doctor Slots (Admin)

```http
GET /api/admin/doctors/:id/slots
```

**Parameters:**
- `id` (path): Doctor ID

**Response:**
```json
[
  {
    "id": 1,
    "doctor_id": 1,
    "start_time": "2024-01-20T10:00:00.000Z",
    "duration_minutes": 30,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Get Statistics

```http
GET /api/admin/stats
```

**Response:**
```json
{
  "doctors": 10,
  "slots": 50,
  "bookings": 25
}
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ installed and running
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MedReserve
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Create database**
   ```bash
   createdb medreserve
   # Or using psql:
   # psql -U postgres
   # CREATE DATABASE medreserve;
   ```

5. **Run database migrations**
   ```bash
   # Initialize schema
   psql -U postgres -d medreserve -f schema.sql
   
   # Run migration for expires_at column
   npm run migrate
   ```

6. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:4000`

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medreserve
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=4000
NODE_ENV=development

# Production (Render)
# DATABASE_URL=postgresql://user:password@host:port/database?ssl=true
```

### Required Variables

- `DB_HOST`: PostgreSQL host (default: `localhost`)
- `DB_PORT`: PostgreSQL port (default: `5432`)
- `DB_NAME`: Database name (default: `medreserve`)
- `DB_USER`: Database user (default: `postgres`)
- `DB_PASSWORD`: Database password
- `PORT`: Server port (default: `4000`)

### Optional Variables

- `NODE_ENV`: Environment mode (`development` | `production`)
- `DATABASE_URL`: Full PostgreSQL connection string (used by Render)

## 🗄 Database Setup

### Automatic Setup (Recommended for Render)

The database schema is **automatically initialized** on server startup. No manual SQL execution needed!

When the server starts, it will:
1. Check if required tables exist (`doctors`, `slots`, `bookings`)
2. Create tables from `sql/init.sql` if missing
3. Run `expires_at` migration automatically if needed

**For Render deployments**: Just set `DATABASE_URL` with `?ssl=true` and deploy. Everything else is automatic!

### Manual Setup (Local Development)

Run the schema file to create all tables:

```bash
psql -U postgres -d medreserve -f schema.sql
```

### Migrations

#### Add expires_at Column

The booking expiry feature requires an `expires_at` column:

```bash
npm run migrate
```

This runs `src/migrations/add_expires_at.js` which:
- Adds `expires_at TIMESTAMPTZ` column to `bookings` table
- Creates index `idx_bookings_status_expires` for efficient queries

### Database Schema

**Tables:**
- `doctors`: Medical professionals
- `slots`: Available appointment time slots
- `bookings`: Patient booking attempts
- `booking_slots`: Junction table (prevents double-booking)

See `schema.sql` for full schema definition.

## 🏃 Running the Server

### Development Mode

```bash
npm run dev
```

Uses `nodemon` for auto-restart on file changes.

### Production Mode

```bash
npm start
```

Runs `node src/server.js`

### Background Jobs

The booking expiry job starts automatically when the server starts. It:
- Runs every 30 seconds
- Marks expired PENDING bookings as FAILED
- Logs activity to console

## 🚢 Deployment

### Deploy to Render (Zero-Configuration)

The backend automatically initializes the database schema on startup. **No manual SQL execution or Shell access required!**

#### Quick Deploy Steps

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure build settings:**
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Create PostgreSQL database** on Render (if not already created)
5. **Add environment variables** in Render Dashboard:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database?ssl=true
   PORT=4000
   NODE_ENV=production
   ```
   
   **Important**: The `DATABASE_URL` must include `?ssl=true` for Render PostgreSQL databases.
   
   Example:
   ```
   postgresql://medreserve_db_user:password@dpg-xxxxx-a.singapore-postgres.render.com:5432/medreserve_db?ssl=true
   ```
6. **Deploy** - The server will automatically:
   - ✅ Connect to the database
   - ✅ Check if tables exist
   - ✅ Create schema from `sql/init.sql` if needed
   - ✅ Run `expires_at` migration automatically
   - ✅ Start the booking expiry job
   - ✅ Begin serving API requests

#### What Happens on Startup

When the server starts, you'll see these console messages:

```
✓ Database connection successful
🔍 Checking database schema...
📌 Schema missing → creating tables from sql/init.sql
✅ Schema ready
ℹ️  Running expires_at migration if needed
✅ Backend fully initialized
🚀 MedReserve API server running on port 4000
```

**No manual intervention needed!** Everything runs automatically.

### Environment Variables for Render

```env
# Required
DATABASE_URL=postgresql://user:password@host:port/database?ssl=true
PORT=4000

# Optional
NODE_ENV=production
```

### Health Check Endpoint

Render uses `/health` endpoint for health checks. Ensure it returns `200 OK`.

## 🧪 Testing

### Manual Testing with Postman

Import the Postman collection (see `postman-collection.json`) to test all endpoints.

### Test Booking Concurrency

Use the provided test script:

```bash
node scripts/concurrentBookingTest.js
```

This simulates multiple concurrent booking attempts on the same slot.

## 📝 API Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `400`: Bad Request (validation errors)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (slot already booked)
- `500`: Internal Server Error

## 🔒 Security Considerations

- **Input Validation**: All endpoints validate required fields
- **SQL Injection Prevention**: Uses parameterized queries
- **CORS**: Configured for frontend domain
- **Transaction Safety**: All booking operations use transactions
- **Error Handling**: Errors don't expose sensitive information

## 📊 Monitoring & Logging

- Query logging: All database queries are logged with duration
- Booking expiry job: Logs when bookings are expired
- Error logging: Errors logged to console (use proper logging service in production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC

## 👤 Author

MedReserve Development Team

---

**Note**: This is a production-ready API with proper error handling, transaction management, and concurrency control. Ensure PostgreSQL is properly configured and migrations are run before deployment.

