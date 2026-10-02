import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongo_uri = process.env.MONGO_URI;
    if(!mongo_uri){
      throw new Error("MONGO_URI is required");
    }
    const connection = await mongoose.connect(mongo_uri);

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
