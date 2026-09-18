# HealthHub — Dual Project Repository

This repository contains two separate projects:
- `backend/` — Laravel API
- `frontend/` — React 18 + Vite

## Agent Guidelines

### Backend (`backend/`)
- All API controllers go in `app/Http/Controllers/Api/`
- Business logic belongs in `app/Services/`
- Use Form Request classes in `app/Http/Requests/` for validation
- API resources go in `app/Http/Resources/`
- WebSocket events go in `app/Events/`
- All routes are defined in `routes/api.php`
- Database is MySQL (`DB_CONNECTION=mysql`)
- Auth uses Laravel Sanctum (token-based)
- Real-time uses Laravel Reverb

### Frontend (`frontend/`)
- Components in `src/components/`
- Page-level components in `src/pages/`
- API service functions in `src/services/` (use the Axios client from `src/config/api.js`)
- React Context providers in `src/context/`
- Custom hooks in `src/hooks/`
- Mapbox config in `src/config/mapbox.js`
- Styling uses TailwindCSS v4

### Running the Project
```bash
# Backend
cd backend && php artisan serve

# Frontend
cd frontend && npm run dev
```
