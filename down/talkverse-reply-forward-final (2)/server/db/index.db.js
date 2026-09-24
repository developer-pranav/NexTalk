import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {dbName: 'TalkVerse'})
        console.log(`MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection error ", error);
        process.exit(1);
    }
}

export default connectDB;