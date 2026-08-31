import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiReq.js";
import { ApiResponse } from "../utils/apiRes.js";
import { Conversation } from "../models/conversation.model.js"
import { Connection } from "../models/connection.model.js";
import { User } from "../models/user.model.js";

const createDirectConversation = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (req.user._id.toString() === userId) {
        throw new ApiError(
            400,
            "You cannot chat with yourself"
        );
    }

    const existingConversation = await Conversation.findOne({
        type: "direct",
        members: {
            $all: [req.user._id, userId]
        }
    });

    // Existing chat → return it
    if (existingConversation) {
        return res.status(200).json(
            new ApiResponse(
                200,
                existingConversation,
                "Conversation already exists"
            )
        );
    }

    // Check blocked
    const connection = await Connection.findOne({
        status: "blocked",
        $or: [
            {
                sender: req.user._id,
                receiver: userId
            },
            {
                sender: userId,
                receiver: req.user._id
            }
        ]
    });

    if (connection) {
        throw new ApiError(
            403,
            "You cannot start a conversation with this user"
        );
    }

    // Check friendship
    const friendship = await Connection.findOne({
        status: "friend",
        $or: [
            {
                sender: req.user._id,
                receiver: userId
            },
            {
                sender: userId,
                receiver: req.user._id
            }
        ]
    });

    if (!friendship) {
        throw new ApiError(
            403,
            "You can only chat with your friends"
        );
    }

    const conversation = await Conversation.create({
        type: "direct",
        members: [
            req.user._id,
            userId
        ]
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            conversation,
            "Conversation created successfully"
        )
    );
});

const getMyConversations = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({
        members: req.user._id
    })
        .populate(
            "members",
            "username fullname avatar"
        )
        .populate(
            "lastMessage",
            "sender type content media createdAt"
        )
        .sort({
            updatedAt: -1
        });

    return res.status(200).json(
        new ApiResponse(
            200,
            conversations,
            "Conversations fetched successfully"
        )
    );
});

const getConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
        .populate(
            "members",
            "username fullname avatar"
        )
        .populate(
            "lastMessage",
            "sender type content media createdAt"
        );

    if (!conversation) {
        throw new ApiError(
            404,
            "Conversation not found"
        );
    }

    const isMember = conversation.members.some(
        member =>
            member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
        throw new ApiError(
            403,
            "You are not a member of this conversation"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            conversation,
            "Conversation fetched successfully"
        )
    );
});

export {
    createDirectConversation,
    getMyConversations,
    getConversation
}