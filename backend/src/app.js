const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const serviceCenterRoutes = require('./routes/serviceCenterRoutes');
const servicePackageRoutes = require('./routes/servicePackageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const documentRoutes = require('./routes/documentRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

const clientUrl = process.env.CLIENT_URL;
const corsOrigin =
  !clientUrl || clientUrl === '*'
    ? true
    : clientUrl
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance-records', maintenanceRoutes);
app.use('/api/service-centers', serviceCenterRoutes);
app.use('/api/service-packages', servicePackageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/complaints', complaintRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
