import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/db.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import profileRoutes from './routes/employeeProfileRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import { authenticate } from './middleware/authMiddleware.js';
import { activityLogger } from './middleware/activityLogger.js';
import roleRoute from './routes/roleRoutes.js';
import roleRequestRoutes from './routes/roleRequestRoutes.js';
import employeeProfileRoute from './routes/employeeProfileRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/users', userRoutes);
app.use('/departments', departmentRoutes);
app.use('/profiles', profileRoutes);
app.use('/activities', activityRoutes);
app.use('/documents', documentRoutes);
app.use('/roles', roleRoute);
app.use('/employee-profiles', employeeProfileRoute);
app.use('/role-requests', roleRequestRoutes);

// Root
app.get('/', (req, res) => {
  res.send('HRMS Backend is running');
});

// Sync DB and start server
const startServer = async () => {
  try {
    //await sequelize.sync({ force: true }); // Drops and recreates all tables (fresh DB)
    console.log('Database synced successfully!');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

startServer();
