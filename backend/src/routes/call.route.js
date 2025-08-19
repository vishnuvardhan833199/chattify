import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMyCallHistory, logCallEnd, logCallStart } from "../controllers/call.controller.js";

const router = express.Router();

router.post("/start", protectRoute, logCallStart);
router.post("/end", protectRoute, logCallEnd);
router.get("/history", protectRoute, getMyCallHistory);

export default router;


