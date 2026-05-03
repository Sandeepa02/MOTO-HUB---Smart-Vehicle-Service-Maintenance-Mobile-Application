# Smart Vehicle Service & Maintenance Mobile Application

Production-structured full-stack project:
- `backend/` -> Node.js + Express + MongoDB Atlas + JWT + bcrypt + Multer
- `mobile/` -> React Native Expo app with React Navigation + Axios + AsyncStorage

## 1) Folder Structure

```text
MOTO-HUB/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      utils/
      app.js
      server.js
    uploads/
    .env.example
    package.json
  mobile/
    src/
      api/
      components/
      context/
      navigation/
      screens/
      config.js
    App.js
    app.json
    babel.config.js
    package.json
  README.md
```

## 2) Backend Setup (Step-by-step)

1. Go to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` from `.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_strong_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=*
```

4. Run backend:
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## 3) Frontend Setup (Step-by-step)

1. Go to mobile:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Update API URL in `mobile/src/config.js`:
```js
export const API_BASE_URL = 'http://YOUR_LOCAL_IP:5000/api';
```
- Use your machine LAN IP (example: `http://192.168.1.10:5000/api`) when testing on physical device.

4. Run Expo:
```bash
npm run start
```

## 4) Backend API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)

### Vehicles (protected)
- `POST /api/vehicles` (multipart: `image`)
- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `PUT /api/vehicles/:id` (multipart optional)
- `DELETE /api/vehicles/:id`

### Bookings (protected)
- `POST /api/bookings`
- `GET /api/bookings`
- `PUT /api/bookings/:id`
- `DELETE /api/bookings/:id`

### Maintenance Records (protected)
- `POST /api/maintenance-records` (multipart: `receiptImage`)
- `GET /api/maintenance-records`
- `PUT /api/maintenance-records/:id` (multipart optional)
- `DELETE /api/maintenance-records/:id`

### Service Centers
- `GET /api/service-centers` (public)
- `GET /api/service-centers/:id` (public)
- `POST /api/service-centers` (protected, multipart: `image`)
- `PUT /api/service-centers/:id` (protected, multipart optional)
- `DELETE /api/service-centers/:id` (protected)

### Reviews
- `GET /api/reviews` (public, optional query: `serviceCenterId`)
- `POST /api/reviews` (protected)
- `PUT /api/reviews/:id` (protected, own review)
- `DELETE /api/reviews/:id` (protected, own review)

### Documents (protected)
- `POST /api/documents` (multipart: `file`, supports PDF/Image)
- `GET /api/documents`
- `PUT /api/documents/:id` (multipart optional)
- `DELETE /api/documents/:id`

### Utility
- `GET /api/health`

## 5) Deployment Ready Notes

### Render / Railway (Backend)
- Set root to `backend/`
- Build command: `npm install`
- Start command: `npm start`
- Add env variables from `.env.example`
- Ensure MongoDB Atlas allows your deployment IP/network access

### MongoDB Atlas
- Create cluster and database user
- Add network access (`0.0.0.0/0` for quick testing, restrict for production)
- Put Atlas URI in backend `MONGO_URI`

## 6) Security & Production Practices Included

- bcrypt password hashing
- JWT token authentication middleware
- Route protection and per-user ownership checks
- Centralized error middleware
- Multer upload validation (mime + file size limit)
- RESTful route design and modular architecture

## 7) Important Notes

- Uploaded files are served from `/uploads`
- For production, use cloud storage (S3/Cloudinary) instead of local disk uploads
- Add role-based authorization (admin/staff/user) if needed for service-center moderation
