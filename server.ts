import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/db.js';

// Route imports
import authRoutes from './server/routes/auth.routes.js';
import propertiesRoutes from './server/routes/properties.routes.js';
import applicationsRoutes from './server/routes/applications.routes.js';
import chatRoutes from './server/routes/chat.routes.js';
import negotiationsRoutes from './server/routes/negotiations.routes.js';
import reviewsRoutes from './server/routes/reviews.routes.js';
import sellersRoutes from './server/routes/sellers.routes.js';
import adminRoutes from './server/routes/admin.routes.js';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Initialize SQLite database
  await getDb();

  // Security HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Vite inline scripts and external images (Unsplash)
      crossOriginEmbedderPolicy: false
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'elo', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertiesRoutes);
  app.use('/api/applications', applicationsRoutes);
  app.use('/api/conversations', chatRoutes);
  app.use('/api/negotiations', negotiationsRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/sellers', sellersRoutes);
  app.use('/api/admin', adminRoutes);

  // Fallback for unknown API routes (generic error, no leak)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint da API não encontrado.' });
  });

  // Global error handler (Section 11.8: never expose stack trace to client)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Erro interno no servidor elo. Detalhes registrados para auditoria.' });
  });

  // Vite middleware in development vs static file serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[elo] Servidor full-stack rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start elo server:', err);
  process.exit(1);
});
