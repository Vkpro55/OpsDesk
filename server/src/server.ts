import app from './app.js';
import { config } from './config/config.js';
import { connectDB } from './utils/db.js';
import { shutdown } from './lifecycle/shutdown.js';

const server = app.listen(config.port, () => {
  console.log(`API listening on :${config.port}`);
});

await connectDB();

process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
process.on('SIGINT', () => shutdown(server, 'SIGINT'));
