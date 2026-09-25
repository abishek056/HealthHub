# Patient HMS – Mobile App (React Native + Real Backend API)

Simple patient-only mobile app connected to a **real Hospital Management System backend**.

## Features
- Patient **Register / Login** (JWT)
- **Book Appointment**
- **My Appointments**
- **Medical Records**
- **SOS Emergency** button

## 1. Point the app to your backend

Edit **one file**:

```ts
// src/api/config.ts
export const API_BASE_URL = 'http://YOUR_SERVER:PORT/api';
```

| Device              | Example URL                          |
|---------------------|--------------------------------------|
| Android emulator    | `http://10.0.2.2:5000/api`           |
| iOS simulator       | `http://localhost:5000/api`          |
| Real phone (same WiFi) | `http://192.168.x.x:5000/api`     |
| Production          | `https://your-hms.com/api`           |

## 2. Expected API endpoints

Your backend should expose (or map to) these:

| Method | Path                    | Auth | Body / Notes |
|--------|-------------------------|------|--------------|
| POST   | `/auth/register`        | No   | `{ name, email, phone, password, age?, bloodGroup?, role: "patient" }` |
| POST   | `/auth/login`           | No   | `{ email, password }` → `{ token, user }` |
| GET    | `/patients/me`          | Yes  | Current patient profile |
| POST   | `/appointments`         | Yes  | `{ department, doctor, date, time, reason }` |
| GET    | `/appointments/my`      | Yes  | List of patient's appointments |
| GET    | `/medical-records/my`   | Yes  | List of medical records |
| GET    | `/departments`          | Yes  | Optional – list of departments |
| GET    | `/doctors`              | Yes  | Optional – `?department=...` |

**Auth header:** `Authorization: Bearer <token>`

If your paths or field names differ, edit the files inside `src/api/` (auth.ts, appointments.ts, records.ts, client.ts). The response normalizers already handle common shapes (`token` / `accessToken`, `user` / `patient`, `id` / `_id`, etc.).

## 3. Run the app

```bash
cd PatientHMS
npm install
npx expo start
```

## 4. Build APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

## Project structure

```
src/
  api/
    config.ts      ← change BASE_URL here
    client.ts      ← fetch + token handling
    auth.ts
    appointments.ts
    records.ts
  screens/
  constants/theme.ts
```

## Tips
- On Android emulator use `10.0.2.2` instead of `localhost`.
- Make sure your backend allows CORS / accepts requests from the app.
- If login works but appointments fail, check the exact response shape of `/appointments/my` and adjust `normalizeAppointment` in `appointments.ts`.
