<div align="center">
  <h1>🚀 Digital Life Lessons Server</h1>
  <p>A high-performance, scalable Node.js backend powering the Digital Life Lessons platform. Built with Express.js, MongoDB, Better-Auth, and seamless integrations with Stripe and Cloudinary.</p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
  </p>
</div>

---

## 🌟 Key Features

- **🔐 Robust Authentication:** Highly secure database-backed session management with `better-auth` and social logins (Google OAuth).
- **💳 Payment Gateway:** Integrated with Stripe for secure, seamless subscription or one-off payments.
- **☁️ Media Management:** Cloudinary integration for scalable, optimized image and media uploads.
- **🛡️ Data Validation:** Strict runtime schema validation using `zod`.
- **🏗️ Modern Architecture:** Built on ES Modules (`"type": "module"`) following a clean MVC (Model-View-Controller) pattern.
- **🚀 Serverless Ready:** Includes Vercel deployment configuration (`vercel.json`) right out of the box.
- **🚨 Global Error Handling:** Centralized error handling middleware for consistent API responses.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Database & ORM:** MongoDB & Mongoose
- **Authentication:** Better-Auth (`better-auth/adapters/mongodb`)
- **Payments:** Stripe API
- **Storage:** Cloudinary (with Multer for multipart form handling)
- **Validation:** Zod
- **Other Utilities:** Cookie Parser, CORS, Morgan, dotenv

---

## 📁 Project Structure

```text
src/
├── auth/          # Better-Auth configurations and instance setup
├── config/        # Environment variables and core app configuration
├── controllers/   # Request handlers and core business logic
├── database/      # Database connection and setup logic
├── middleware/    # Custom Express middlewares (auth checking, error handling)
├── models/        # Mongoose data models/schemas for MongoDB
├── routes/        # API route definitions (Users, Lessons, Payments, etc.)
├── services/      # 3rd party integrations logic (Cloudinary upload logic)
└── stripe/        # Stripe-specific webhooks and related logic
```

---

## 📡 API Endpoints Overview

The backend exposes several modular RESTful API endpoints. Below is a high-level overview of the available resources:

| Resource Path    | Description                                                   |
| :--------------- | :------------------------------------------------------------ |
| `/api/auth`      | Authentication routes automatically managed by `better-auth`. |
| `/api/users`     | User profile management, updates, and settings.               |
| `/api/lessons`   | Fetching, creating, updating, and deleting life lessons.      |
| `/api/comments`  | Interactions and discussions under lessons.                   |
| `/api/favorites` | User's bookmarked or favorite lessons.                        |
| `/api/payments`  | Stripe checkout sessions and payment validations.             |
| `/api/uploads`   | Cloudinary media upload endpoints.                            |
| `/api/reports`   | User reporting system for content moderation.                 |
| `/api/admin`     | Protected routes for administrative dashboard and controls.   |

> _Note: Protected endpoints require a valid session cookie established via `/api/auth`._

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
- Valid accounts and API keys for [Cloudinary](https://cloudinary.com/), [Stripe](https://stripe.com/), and Google Cloud (for OAuth).

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rihadjahanopu/life-lesson-server.git
cd life-lesson-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in the necessary credentials in your newly created `.env` file:

- `PORT`: The port the server runs on (e.g., 5000)
- `MONGODB_URI`: Connection string for your MongoDB database.
- `BETTER_AUTH_SECRET`: A secure random string for signing sessions.
- `GOOGLE_CLIENT_ID` / `SECRET`: For Google OAuth login.
- `STRIPE_SECRET_KEY` / `WEBHOOK_SECRET`: For processing payments securely.
- `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `SECRET`: For media uploads.

### 4. Available Scripts

- **`npm run dev`**: Starts the server in development mode using Node's native `--watch` flag. Auto-restarts on file changes.
- **`npm start`**: Starts the server in production mode.

```bash
npm run dev
```

---

## 📦 Deployment

This project includes a `vercel.json` file, making it ready to be deployed as Serverless Functions directly on [Vercel](https://vercel.com).

**Deploy via Vercel CLI:**

```bash
npm i -g vercel
vercel
```

> **Important:** Ensure you add all your `.env` variables to your project's Environment Variables settings in the Vercel Dashboard before deploying.

---

## 🛡️ License & Contributing

- **Contributing:** Contributions, issues, and feature requests are welcome. Feel free to check the issues page if you want to contribute.
- **License:** This project is licensed under the ISC License.

---

<div align="center">
  <i>Developed with ❤️ for the Digital Life Lessons platform.</i>
</div>
