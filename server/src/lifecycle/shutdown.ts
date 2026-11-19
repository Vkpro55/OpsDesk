import type { Server } from 'node:http';
import mongoose from 'mongoose';
import redis from '../utils/redis.js';

let shuttingDown = false;

async function shutdown(server: Server, signal: NodeJS.Signals) {
    if (shuttingDown) {
        console.log(`Shutdown already in progress. Ignoring signal: ${signal}`);
        return;
    }

    shuttingDown = true;

    server.close(async (err) => {
        try {
            await mongoose.connection.close();
            await redis.quit();
            process.exit(err ? 1 : 0);
        } catch {
            process.exit(1);
        }
    });

    // Close idle connections immediately
    server.closeIdleConnections();
}

export { shutdown };
