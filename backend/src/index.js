import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from "@clerk/express"
import clerkWebhook from "./webhooks/clerk.webhook.js"

const app = express();

import user from "./routes/user.routes.js";
import hackathon from "./routes/hackathon.routes.js";

app.use("/api/webhooks/clerk",express.raw({type:"application/json"}),clerkWebhook);


app.use(cors());
app.use(clerkMiddleware());

app.use(express.json());

app.use("/api/users",user);
app.use("/api/hackathons",hackathon);

export default app;