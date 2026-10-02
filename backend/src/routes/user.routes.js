import express from "express"
import { upload } from "../middleware/upload.middleware.js";
import { saveUser ,getUser} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/clerk.middleware.js";

const route = express.Router();

route.use(protectRoute);

route.put("/profile",upload.single("media"),saveUser);
route.get("/profile",getUser);


export default route;