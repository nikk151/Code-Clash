# Code Clash API ⚔️

The backend engine for Code Clash, a real-time competitive programming platform. Built with Node.js, Express, Socket.io, and MongoDB.

## Features

- **Real-time Matchmaking**: Seamlessly pair up with rivals using Socket.io.
- **Code Execution**: Integrated with JDoodle API to run code in 70+ languages.
- **ELO Rating System**: Automated skill-based matchmaking and ranking.
- **Security**: JWT-based authentication with HttpOnly cookies and rate limiting.
- **Problem Library**: Robust problem management with constraints and test cases.

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Security**: [Helmet](https://helmetjs.github.io/), [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)
- **Authentication**: [JWT](https://jwt.io/), [Bcrypt](https://www.npmjs.com/package/bcrypt)

## Getting Started

### Prerequisites

- Node.js installed
- A MongoDB Atlas Cluster or local MongoDB instance
- JDoodle API credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=8000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   JDOODLE_CLIENT_ID=your_id
   JDOODLE_CLIENT_SECRET=your_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_app_password
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/register`: Create a new account.
- `POST /api/auth/login`: Sign in and receive a session cookie.
- `GET /api/problems`: List available coding challenges.
- `POST /api/match/create`: Initialize a private or public match.
- `GET /api/leaderboard`: Fetch the top-ranking warriors.

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for generating session tokens |
| `FRONTEND_URL` | The URL of your React frontend (for CORS) |
| `JDOODLE_*` | API credentials from jdoodle.com |

## License

MIT