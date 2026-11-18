import mongoose from "mongoose";
import { config } from "../config/config.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUrl);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB: ", error);
        process.exit(1);
    }
};