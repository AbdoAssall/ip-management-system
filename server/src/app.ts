import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import deviceRoutes from './routes/devices';
import categoryRoutes from './routes/categories';
import ipRoutes from './routes/ipAddresses';
import vlanRoutes from './routes/vlans';
import auditRoutes from './routes/auditLogs';
import notificationRoutes from './routes/notifications';
import branchRoutes from './routes/branches';
import departmentRoutes from './routes/departments';
import employeeRoutes from './routes/employees';
import reportRoutes from './routes/reports';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PSCCHC Asset & IP Management API',
      version: '1.0.0',
      description: 'REST API for managing IT assets and IP addresses at Port Said Container & Cargo Handling Company',
    },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #2A324A; }',
  customSiteTitle: 'PSCCHC API Documentation',
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ip-addresses', ipRoutes);
app.use('/api/vlans', vlanRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'PSCCHC Asset & IP Management API' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 PSCCHC API running on http://localhost:${PORT}`);
  console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
});

export default app;
