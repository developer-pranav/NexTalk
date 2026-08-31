import { Router } from "express";

import {
    getMessages,
    sendMessage,
    sendMediaMessage,
    deleteMessage
} from "../controllers/message.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.get(
    "/:conversationId",
    verifyJWT,
    getMessages
);

router.post(
    "/:conversationId",
    verifyJWT,
    sendMessage
);

router.post(
    "/:conversationId/media",
    verifyJWT,
    upload.single("media"),
    sendMediaMessage
);

router.delete(
    "/:messageId",
    verifyJWT,
    deleteMessage
);

export default router;