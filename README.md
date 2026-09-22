# HealthHub

HealthHub is a hospital management and emergency response platform built with a Laravel REST API backend and a React + Vite frontend. It supports hospital discovery, bed and ambulance tracking, OPD queue management, blood donation workflows, appointments, and administrative oversight.

## Features

- Hospital listing and detail pages
- Bed availability monitoring
- Ambulance location tracking
- OPD queue booking and status updates
- Emergency nearest-hospital lookup
- Blood bank and donor management
- Appointment booking and patient records
- Super-admin dashboard and hospital management tools
- Real-time updates through Laravel Reverb

## Tech Stack

| Layer     | Technology           |
| --------- | -------------------- |
| Backend   | Laravel 13 + PHP 8.3 |
| Frontend  | React 19 + Vite      |
| Styling   | Tailwind CSS         |
| Database  | MySQL                |
| Auth      | Laravel Sanctum      |
| Real-time | Laravel Reverb       |
| Maps      | Mapbox GL            |
| Testing   | PHPUnit              |

## Repository Structure

```text
HealthHub/
├── backend/           # Laravel API
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── tests/
│   ├── .env.example
│   ├── artisan
│   ├── composer.json
│   └── phpunit.xml
├── frontend/          # React frontend
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── README.md
└── .gitignore
```

## Prerequisites

Before running the project, make sure you have:

- PHP 8.3+
- Composer 2+
- Node.js 18+
- npm 9+
- MySQL 8+

## Environment Setup

### 1. Clone the project

```bash
git clone <repo-url> HealthHub
cd HealthHub
```

### 2. Backend setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Update the backend environment variables in `backend/.env` for your local database and app configuration.

Example values:

```env
APP_NAME=HealthHub
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=healthhub
DB_USERNAME=root
DB_PASSWORD=
```

Create the database and run migrations:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS healthhub;"
php artisan migrate
```

Start the API:

```bash
php artisan serve
```

The API will run at:

```text
http://localhost:8000
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Add your frontend environment values if needed, especially for Mapbox access.

Example:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

Start the frontend:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:3000
```

### 4. Real-time server

To enable WebSocket-driven realtime updates:

```bash
cd backend
php artisan reverb:start
```

This server runs on:

```text
http://localhost:8080
```

## Running the Project Together

Open multiple terminals and run:

```bash
# Terminal 1
cd backend && php artisan serve

# Terminal 2
cd frontend && npm run dev

# Terminal 3 (optional)
cd backend && php artisan reverb:start
```

## Main API Routes

The backend exposes routes under `/api` in `backend/routes/api.php`.

### Public endpoints

- `GET /api/hospitals`
- `GET /api/hospitals/{id}`
- `GET /api/hospitals/{id}/beds`
- `GET /api/hospitals/{id}/ambulances`
- `GET /api/hospitals/{id}/opd`
- `GET /api/blood-banks`
- `GET /api/blood-donors`
- `GET /api/emergency/find-nearest-hospital`
- `POST /api/appointments`
- `POST /api/auth/login`
- `POST /api/auth/register`

### Protected/admin routes

- `POST /api/auth/logout`
- `GET /api/appointments`
- `PUT /api/hospitals/{id}/beds/{bedId}`
- `PUT /api/hospitals/{id}/ambulances/{ambulanceId}/track`
- `PUT /api/hospitals/{id}/opd`
- `GET /api/admin/stats`
- `GET /api/admin/hospitals`
- `POST /api/admin/users`

## Development Notes

- Laravel app logic is in `backend/app`
- API routes are defined in `backend/routes/api.php`
- Frontend pages and UI live under `frontend/src`
- The app uses a tenant-aware authorization pattern for hospital staff and resources

## Testing

```bash
cd backend
php artisan test
```

## License

This project is licensed under the MIT License.
