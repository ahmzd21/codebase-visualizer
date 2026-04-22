# Codebase Visualizer — REST API

**Course:** Advanced Web Technologies
**Project:** Codebase Visualizer — Developer Insight Tool

---

## Group Information

| Member | Role |
|--------|------|
| Member 1 | Auth Module, Repository Module, Job Module, Middleware |
| Member 2 | File Module, Graph Module, Metrics Module, Error Handling |

---

## Project Overview

A REST API backend that allows developers to submit a GitHub repository URL and receive structured insights about its architecture — including dependency graphs, complexity metrics, and hotspot detection.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (jsonwebtoken + bcryptjs)
- **Validation:** express-validator
- **Security:** express-mongo-sanitize, express-rate-limit
- **Logging:** morgan

---

## Project Structure

```
codebase-visualizer/
├── server.js                        # Entry point
├── .env.example                     # Environment variable template
├── src/
│   ├── app.js                       # Express app setup, middleware, routes
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Repository.js
│   │   ├── Job.js
│   │   ├── File.js
│   │   └── Graph.js
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification → req.user
│   │   ├── ownership.middleware.js  # Repo ownership check → req.repo
│   │   ├── validate.middleware.js   # express-validator error reader
│   │   ├── asyncHandler.js         # Wraps async controllers
│   │   └── error.middleware.js     # Global error handler
│   ├── utils/
│   │   ├── AppError.js             # Custom operational error class
│   │   └── response.js             # Standardized sendSuccess / sendError
│   └── modules/
│       ├── auth/
│       │   ├── auth.routes.js
│       │   ├── auth.controller.js
│       │   ├── auth.service.js
│       │   └── auth.validation.js
│       ├── repository/
│       │   ├── repository.routes.js
│       │   ├── repository.controller.js
│       │   ├── repository.service.js
│       │   └── repository.validation.js
│       ├── job/
│       │   ├── job.routes.js
│       │   ├── job.controller.js
│       │   └── job.service.js
│       ├── file/
│       │   ├── file.routes.js
│       │   ├── file.controller.js
│       │   └── file.service.js
│       ├── graph/
│       │   ├── graph.routes.js
│       │   ├── graph.controller.js
│       │   └── graph.service.js
│       └── metrics/
│           ├── metrics.routes.js
│           ├── metrics.controller.js
│           └── metrics.service.js
```

---

## Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/codebase-visualizer.git
cd codebase-visualizer
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/codebase-visualizer
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 4. Start the server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## API Endpoints Reference

### Health Check
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/health` | No |

### Auth Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, receive JWT |

### Repository Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/repos/analyze` | Yes | Submit repo URL for analysis |
| GET | `/api/repos` | Yes | Get all repos for current user |
| GET | `/api/repos/:repoId` | Yes | Get single repo metadata |

### Job Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/jobs/:jobId` | Yes | Get job status and progress |

### File Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/repos/:repoId/files` | Yes | Get all analyzed files |
| GET | `/api/repos/:repoId/files/:fileId` | Yes | Get single file details |

### Graph Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/repos/:repoId/graph` | Yes | Get dependency graph |

### Metrics Module
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/repos/:repoId/metrics` | Yes | Get repo-wide metrics |
| GET | `/api/repos/:repoId/hotspots` | Yes | Get hotspot files by risk score |

---

## Authentication

All protected routes require a JWT token in the request header:

```
Authorization: Bearer <your_token_here>
```

---

## Error Response Format

All errors follow this consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description."
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_INPUT` | 400 | Validation failed |
| `AUTH_REQUIRED` | 401 | No token provided |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | JWT has expired |
| `FORBIDDEN` | 403 | Resource belongs to another user |
| `NOT_FOUND` | 404 | Route or resource not found |
| `REPO_NOT_FOUND` | 404 | Repository ID does not exist |
| `FILE_NOT_FOUND` | 404 | File ID does not exist |
| `JOB_NOT_FOUND` | 404 | Job ID does not exist |
| `EMAIL_ALREADY_EXISTS` | 409 | Email already registered |
| `ANALYSIS_INCOMPLETE` | 202 | Analysis still in progress |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Testing with Postman

Recommended flow:

1. `POST /api/auth/register` → get token
2. Set `Authorization: Bearer <token>` in Postman headers
3. `POST /api/repos/analyze` → get `repoId` and `jobId`
4. `GET /api/jobs/:jobId` → poll until `status: "done"` (takes ~5 seconds)
5. `GET /api/repos/:repoId/graph` → view dependency graph
6. `GET /api/repos/:repoId/metrics` → view complexity metrics
7. `GET /api/repos/:repoId/hotspots` → view risk hotspots
8. `GET /api/repos/:repoId/files` → view all files

> **Note:** The analysis simulation takes approximately 5 seconds to complete. Poll the job endpoint until `progress` reaches `100` before calling graph/metrics/file endpoints.
