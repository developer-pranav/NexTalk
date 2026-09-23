import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiReq.js";
import { ApiResponse } from "../utils/apiRes.js";

import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Connection } from "../models/connection.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";


const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    const page = Math.max(
        parseInt(req.query.page) || 1,
        1
    );

    const limit = Math.min(
        Math.max(parseInt(req.query.limit) || 30, 1),
        100
    );

    const conversation = await Conversation.findById(
        conversationId
    );

    if (!conversation) {
        throw new ApiError(
            404,
            "Conversation not found"
        );
    }

    const isMember = conversation.members.some(
        member =>
            member.toString() === req.user._id.toString()
    );

    if (!isMember) {
        throw new ApiError(
            403,
            "You are not a member of this conversation"
        );
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
        conversation: conversationId
    })
        .populate(
            "sender",
            "username fullname avatar"
        )
        .sort({
            createdAt: -1
        })
        .skip(skip)
        .limit(limit);

    const totalMessages = await Message.countDocuments({
        conversation: conversationId
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                messages,
                pagination: {
                    page,
                    limit,
                    totalMessages,
                    totalPages: Math.ceil(
                        totalMessages / limit
                    ),
                    hasMore:
                        page * limit < totalMessages
                }
            },
            "Messages fetched successfully"
        )
    );
});


const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(
            400,
            "Message content is required"
        );
    }

    const conversation = await Conversation.findById(
        conversationId
    );

    if (!conversation) {
        throw new ApiError(
            404,
            "Conversation not found"
        );
    }

    const isMember = conversation.members.some(
        member =>
            member.toString() === req.user._id.toString()
    );

    if (!isMember) {
        throw new ApiError(
            403,
            "You are not a member of this conversation"
        );
    }

    // Check block only for direct conversations
    if (conversation.type === "direct") {

        const otherUser = conversation.members.find(
            member =>
                member.toString() !==
                req.user._id.toString()
        );

        const blocked = await Connection.findOne({
            status: "blocked",
            $or: [
                {
                    sender: req.user._id,
                    receiver: otherUser
                },
                {
                    sender: otherUser,
                    receiver: req.user._id
                }
            ]
        });

        if (blocked) {
            throw new ApiError(
                403,
                "You cannot send messages to this user"
            );
        }
    }

    const message = await Message.create({
        conversation: conversationId,
        sender: req.user._id,
        type: "text",
        content: content.trim()
    });

    conversation.lastMessage = message._id;

    await conversation.save();

    const populatedMessage = await Message.findById(
        message._id
    ).populate(
        "sender",
        "username fullname avatar"
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            populatedMessage,
            "Message sent successfully"
        )
    );
});


const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
        throw new ApiError(
            404,
            "Message not found"
        );
    }

    if (
        message.sender.toString() !==
        req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You can only delete your own messages"
        );
    }

    await Message.findByIdAndDelete(messageId);

    // If deleted message was lastMessage,
    // find the previous message
    const conversation = await Conversation.findById(
        message.conversation
    );

    if (conversation?.lastMessage?.toString() === messageId) {

        const previousMessage = await Message.findOne({
            conversation: message.conversation
        })
            .sort({
                createdAt: -1
            });

        conversation.lastMessage =
            previousMessage?._id || null;

        await conversation.save();
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Message deleted successfully"
        )
    );
});

const sendMediaMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(
        conversationId
    );

    if (!conversation) {
        throw new ApiError(
            404,
            "Conversation not found"
        );
    }

    const isMember = conversation.members.some(
        member =>
            member.toString() === req.user._id.toString()
    );

    if (!isMember) {
        throw new ApiError(
            403,
            "You are not a member of this conversation"
        );
    }

    if (conversation.type === "direct") {

        const otherUser = conversation.members.find(
            member =>
                member.toString() !==
                req.user._id.toString()
        );

        const blocked = await Connection.findOne({
            status: "blocked",
            $or: [
                {
                    sender: req.user._id,
                    receiver: otherUser
                },
                {
                    sender: otherUser,
                    receiver: req.user._id
                }
            ]
        });

        if (blocked) {
            throw new ApiError(
                403,
                "You cannot send messages to this user"
            );
        }
    }


    if (!req.file) {
        throw new ApiError(
            400,
            "Media file is required"
        );
    }

    const uploadedFile = await uploadOnCloudinary(
        req.file.path,
        `NexTalk/Chat/${conversationId}`
    );

    if (!uploadedFile) {
        throw new ApiError(
            500,
            "Failed to upload media"
        );
    }

    let messageType;

    if (req.file.mimetype.startsWith("image/")) {
        messageType = "image";
    } else if (req.file.mimetype.startsWith("video/")) {
        messageType = "video";
    } else if (req.file.mimetype.startsWith("audio/")) {
        messageType = "audio";
    } else {
        messageType = "file";
    }

    const message = await Message.create({
        conversation: conversationId,
        sender: req.user._id,
        type: messageType,
        media: {
            url: uploadedFile.secure_url,
            publicId: uploadedFile.public_id,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        }
    });

    conversation.lastMessage = message._id;

    await conversation.save();

    const populatedMessage = await Message.findById(
        message._id
    ).populate(
        "sender",
        "username fullname avatar"
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            populatedMessage,
            "Media message sent successfully"
        )
    );
})


export {
    getMessages,
    sendMessage,
    deleteMessage,
    sendMediaMessage
};