import dotenv from 'dotenv';
dotenv.config();

export const config : Readonly<{
  nodeEnv: string;
    port: number;
    mongoUrl: string;
    jwtSecret: string;
    clientUrl: string;
    redisHost: string;
    redisPort: number;
}> = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 4000),
    mongoUrl: process.env.MONGO_URL ?? 'mongodb://localhost:27017/opsdesk',
    jwtSecret: process.env.JWT_SECRET ?? 'opsdesk-secret-key@123',
    clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
    redisHost: process.env.REDIS_HOST ?? 'localhost',
    redisPort: Number(process.env.REDIS_PORT ?? 6379)
};