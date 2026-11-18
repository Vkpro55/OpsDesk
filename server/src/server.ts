import app from './app.js';
import { config } from './config/config.js';
import { connectDB } from './utils/db.js';
import redis from './utils/redis.js';

// Connect to the database and Redis
await connectDB();
await redis.ping();

// Start the server once the database and Redis connections are established
app.listen(config.port, () => {
  console.log(`API listening on :${config.port}`);
});
