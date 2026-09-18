# HealthHub — Hospital Management System

A desktop web application for hospital management built with **Laravel API** (backend) and **React + Vite** (frontend).

## Tech Stack

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| Backend      | Laravel (PHP) — RESTful API       |
| Frontend     | React 18 + Vite                   |
| Database     | MySQL                             |
| Auth         | Laravel Sanctum (token-based)     |
| Real-time    | Laravel Reverb (WebSockets)       |
| Maps         | Mapbox GL                         |
| Styling      | TailwindCSS v4                    |

## Project Structure

```
HealthHub/
├── backend/          ← Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   ├── Middleware/
│   │   │   ├── Requests/
│   │   │   ├── Resources/
│   │   │   └── Collections/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Helpers/
│   │   ├── Events/
│   │   └── Providers/
│   ├── routes/
│   │   └── api.php
│   ├── database/
│   │   ├── migrations/
│   │   ├── factories/
│   │   └── seeders/
│   ├── config/
│   ├── tests/
│   ├── .env
│   └── composer.json
│
├── frontend/         ← React 18 + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── config/
│   │   ├── assets/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
└── README.md
```

## Prerequisites

- **PHP** >= 8.3
- **Composer** >= 2.x
- **Node.js** >= 18.x
- **MySQL** >= 8.x

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repo-url> HealthHub
cd HealthHub
```

### 2. Backend Setup

```bash
cd backend

# Install PHP dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Create the MySQL database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS healthhub;"

# Run migrations
php artisan migrate

# Start the API server
php artisan serve
```

The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env to add your Mapbox token

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 4. Real-time (WebSockets)

```bash
cd backend
php artisan reverb:start
```

Reverb WebSocket server runs on `http://localhost:8080`.

## Development

Run both servers simultaneously:

```bash
# Terminal 1 — Backend API
cd backend && php artisan serve

# Terminal 2 — Frontend dev server
cd frontend && npm run dev

# Terminal 3 — WebSocket server (optional)
cd backend && php artisan reverb:start
```

## API Endpoints

All API routes are defined in `backend/routes/api.php` and prefixed with `/api`.

## License

MIT
