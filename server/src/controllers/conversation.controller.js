import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiReq.js";
import { ApiResponse } from "../utils/apiRes.js";
import { Conversation } from "../models/conversation.model.js"
import { Connection } from "../models/connection.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

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
    // Backfill a direct conversation for existing friendships as well.
    // This also fixes friendships that were accepted before auto-chat creation was added.
    const friendships = await Connection.find({
        status: "friend",
        $or: [
            { sender: req.user._id },
            { receiver: req.user._id },
        ],
    }).select("sender receiver");

    for (const friendship of friendships) {
        const otherUserId = friendship.sender.toString() === req.user._id.toString()
            ? friendship.receiver
            : friendship.sender;

        const existingConversation = await Conversation.findOne({
            type: "direct",
            members: { $all: [req.user._id, otherUserId] },
        });

        if (!existingConversation) {
            await Conversation.create({
                type: "direct",
                members: [req.user._id, otherUserId],
            });
        }
    }

    const conversations = await Conversation.find({
        members: req.user._id
    })
        .populate(
            "members",
            "username fullname avatar isOnline"
        )
        .populate({
            path: "lastMessage",
            select: "sender type content media createdAt",
            populate: {
                path: "sender",
                select: "_id",
            },
        })
        .sort({
            updatedAt: -1
        });


    const blockedConnections = await Connection.find({
        status: "blocked",
        $or: [
            { sender: req.user._id },
            { receiver: req.user._id },
        ],
    }).select("sender receiver blockedBy");

    const blockedByUserMap = new Map();

    for (const connection of blockedConnections) {
        const otherUserId =
            String(connection.sender) === String(req.user._id)
                ? String(connection.receiver)
                : String(connection.sender);

        blockedByUserMap.set(
            otherUserId,
            String(connection.blockedBy)
        );
    }

    const conversationsWithUnread = await Promise.all(
        conversations.map(async (conversation) => {
            const unreadCount = await Message.countDocuments({
                conversation: conversation._id,
                sender: { $ne: req.user._id },
                seenBy: { $ne: req.user._id },
            });

            const data = conversation.toObject();
            data.unreadCount = unreadCount;

            if (conversation.type === "direct") {
                const otherUser = conversation.members.find(
                    (member) =>
                        String(member._id) !== String(req.user._id)
                );

                if (otherUser) {
                    const blockerId = blockedByUserMap.get(
                        String(otherUser._id)
                    );

                    data.blockedByMe =
                        Boolean(blockerId) &&
                        blockerId === String(req.user._id);

                    data.blockedByOther =
                        Boolean(blockerId) &&
                        blockerId !== String(req.user._id);
                } else {
                    data.blockedByMe = false;
                    data.blockedByOther = false;
                }
            } else {
                data.blockedByMe = false;
                data.blockedByOther = false;
            }

            return data;
        })
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            conversationsWithUnread,
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