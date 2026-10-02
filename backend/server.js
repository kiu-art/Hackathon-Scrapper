import { setServers } from "dns";
setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config"
import connectDB from "./src/lib/mongoDB.js";
import app from "./src/index.js";
import { initHackathonCron } from "./src/services/hackthonCron.service.js";
import job from "./src/lib/cron.js"

connectDB();

app.listen(process.env.EXPRESS_PORT,()=>{console.log(`Server Started at ${process.env.EXPRESS_PORT}`);
    initHackathonCron();
    if(process.env.NODE_ENV=="production"){
        job.start()
    }
})