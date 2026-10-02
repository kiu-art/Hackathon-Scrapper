import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from "@clerk/express"
import clerkWebhook from "./webhooks/clerk.webhook.js"

const app = express();

import user from "./routes/user.routes.js";
import hackathon from "./routes/hackathon.routes.js";
// Define allowed origins for both development and production
const allowedOrigins = [
  "http://localhost:5173",          // Vite local development
  process.env.CLIENT_URL,           // Production frontend URL (set in Render/cloud dashboard)
].filter(Boolean);                  // Filters out undefined if CLIENT_URL isn't set locally

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, server-to-server, or curl) or matching origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
      }
    },
    credentials: true, // Allows Clerk session tokens, authorization headers, and cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use("/api/webhooks/clerk",express.raw({type:"application/json"}),clerkWebhook);


app.use(clerkMiddleware());

app.use(express.json());

app.use("/api/users",user);
app.use("/api/hackathons",hackathon);

export default app;