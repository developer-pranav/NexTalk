import { Router } from "express";

import {
    createDirectConversation,
    getMyConversations,
    getConversation
} from "../controllers/conversation.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
    "/direct/:userId",
    verifyJWT,
    createDirectConversation
);

router.get(
    "/",
    verifyJWT,
    getMyConversations
);

router.get(
    "/:conversationId",
    verifyJWT,
    getConversation
);

export default router;