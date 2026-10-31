import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import app from './app.js';
import { testConnection, closePool } from './config/database.js';
import { startSlaMonitorJob } from './jobs/slaMonitor.job.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  console.log('🚀 Initializing NagrikSeva Backend API...');
  console.log(`📦 Storage Engine: ${process.env.STORAGE_PROVIDER === 'supabase' && process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Supabase Cloud Bucket (' + process.env.SUPABASE_BUCKET + ')' : 'Local Disk (/uploads)'}`);

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('⚠️ Warning: Database connection check failed on startup. Server will start, but database queries may fail until PostgreSQL is available.');
  }

  // Start background jobs
  startSlaMonitorJob();

  // Listen on PORT
  const server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🏛️  NagrikSeva Backend API running on port ${PORT}`);
    console.log(`📡 Base API URL: http://localhost:${PORT}/api/v1`);
    console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`=================================================`);
  });

  // Graceful shutdown
  const handleShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      await closePool();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('❌ Fatal error starting NagrikSeva server:', err);
  process.exit(1);
});

