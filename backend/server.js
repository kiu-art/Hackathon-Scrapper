import { setServers } from "dns";
setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config"
import connectDB from "./src/lib/mongoDB.js";
import app from "./src/index.js";
import { initHackathonCron } from "./src/services/hackthonCron.service.js";
import job from "./src/lib/cron.js"

connectDB();

app.listen(3000,()=>{console.log("Server Started at 3000");
    initHackathonCron();
    if(process.env.NODE_ENV=="production"){
        job.start()
    }
})