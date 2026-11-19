import app from './app.js';
import { config } from './config/config.js';
import { connectDB } from './utils/db.js';
import { shutdown } from './lifecycle/shutdown.js';

// Start the server once the database and Redis connections are established
const server = app.listen(config.port, () => {
  console.log(`API listening on :${config.port}`);
});

// Connect to the database and Redis
await connectDB();

// Catch the signals for graceful shutdown
process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
process.on('SIGINT', () => shutdown(server, 'SIGINT'));
