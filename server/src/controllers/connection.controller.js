import { User } from "../models/user.model.js";
import { Connection } from "../models/connection.model.js";
import { Conversation } from "../models/conversation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiReq.js";
import { ApiResponse } from "../utils/apiRes.js";

// Send friend request
const sendFriendRequest = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
        throw new ApiError(
            400,
            "You cannot send a friend request to yourself"
        );
    }

    const receiver = await User.findById(userId);

    if (!receiver) {
        throw new ApiError(404, "User not found");
    }

    const existingConnection = await Connection.findOne({
        $or: [
            {
                sender: req.user._id,
                receiver: userId,
            },
            {
                sender: userId,
                receiver: req.user._id,
            },
        ],
    });

    if (existingConnection) {
        if (existingConnection.status === "blocked") {
            throw new ApiError(
                403,
                "You cannot send a request to this user"
            );
        }

        if (existingConnection.status === "friend") {
            throw new ApiError(
                409,
                "You are already friends"
            );
        }

        if (existingConnection.status === "pending") {
            throw new ApiError(
                409,
                "Friend request already exists"
            );
        }

        if (existingConnection.status === "rejected") {
            existingConnection.sender = req.user._id;
            existingConnection.receiver = userId;
            existingConnection.status = "pending";

            await existingConnection.save();

            return res.status(200).json(
                new ApiResponse(
                    200,
                    existingConnection,
                    "Friend request sent successfully"
                )
            );
        }
    }

    const connection = await Connection.create({
        sender: req.user._id,
        receiver: userId,
        status: "pending",
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            connection,
            "Friend request sent successfully"
        )
    );
});

// Get received friend requests
const getFriendRequests = asyncHandler(async (req, res) => {
    const requests = await Connection.find({
        receiver: req.user._id,
        status: "pending",
    }).populate(
        "sender",
        "username fullname avatar"
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            requests,
            "Friend requests fetched successfully"
        )
    );
});

// Get all my connections and pending requests
const getMyConnections = asyncHandler(async (req, res) => {
    const connections = await Connection.find({
        $or: [
            { sender: req.user._id },
            { receiver: req.user._id },
        ],
        status: { $in: ["friend", "pending"] },
    }).populate(
        "sender receiver",
        "username fullname avatar bio"
    );

    const formattedConnections = connections
        .map((connection) => {
            const currentUserId = String(req.user._id);
            const senderId = connection.sender?._id?.toString();
            const receiverId = connection.receiver?._id?.toString();

            const connectedUser =
                senderId === currentUserId
                    ? connection.receiver
                    : connection.sender;

            if (!connectedUser) return null;

            return {
                ...connectedUser.toObject(),
                connectionId: connection._id,
                status: connection.status,
                senderId,
                receiverId,
            };
        })
        .filter(Boolean);

    return res.status(200).json(
        new ApiResponse(
            200,
            formattedConnections,
            "Connections fetched successfully"
        )
    );
});

// Cancel a pending friend request
const cancelFriendRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await Connection.findOne({
        _id: requestId,
        sender: req.user._id,
        status: "pending",
    });

    if (!request) {
        throw new ApiError(
            404,
            "Pending friend request not found"
        );
    }

    await Connection.findByIdAndDelete(request._id);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Friend request cancelled successfully"
        )
    );
});

// Accept friend request
const acceptFriendRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await Connection.findById(requestId);

    if (!request) {
        throw new ApiError(
            404,
            "Friend request not found"
        );
    }

    if (
        request.receiver.toString() !==
        req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You cannot accept this request"
        );
    }

    if (request.status !== "pending") {
        throw new ApiError(
            400,
            "Friend request is no longer pending"
        );
    }

    request.status = "friend";

    await request.save();

    // Create the direct chat immediately after the request is accepted.
    // The same conversation is shared by both users.
    let conversation = await Conversation.findOne({
        type: "direct",
        members: { $all: [request.sender, request.receiver] },
    });

    if (!conversation) {
        conversation = await Conversation.create({
            type: "direct",
            members: [request.sender, request.receiver],
        });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { request, conversation },
            "Friend request accepted and conversation created"
        )
    );
});

// Reject friend request
const rejectFriendRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    const request = await Connection.findById(requestId);

    if (!request) {
        throw new ApiError(
            404,
            "Friend request not found"
        );
    }

    if (
        request.receiver.toString() !==
        req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You cannot reject this request"
        );
    }

    if (request.status !== "pending") {
        throw new ApiError(
            400,
            "Friend request is no longer pending"
        );
    }

    request.status = "rejected";

    await request.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            request,
            "Friend request rejected"
        )
    );
});

// Block user
const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
        throw new ApiError(
            400,
            "You cannot block yourself"
        );
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const connection = await Connection.findOne({
        $or: [
            {
                sender: req.user._id,
                receiver: userId,
            },
            {
                sender: userId,
                receiver: req.user._id,
            },
        ],
    });

    if (connection) {
        if (
            connection.status === "blocked" &&
            connection.blockedBy?.toString() ===
            req.user._id.toString()
        ) {
            throw new ApiError(
                409,
                "User is already blocked"
            );
        }

        connection.status = "blocked";
        connection.blockedBy = req.user._id;

        await connection.save();
    } else {
        await Connection.create({
            sender: req.user._id,
            receiver: userId,
            status: "blocked",
            blockedBy: req.user._id,
        });
    }

    const io = req.app.get("io");

    if (io) {
        io.to(`user:${userId}`).emit("blockStatusChanged", {
            blockerId: String(req.user._id),
            blocked: true,
        });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "User blocked successfully"
        )
    );
});

// Get blocked users
const getBlockedUsers = asyncHandler(async (req, res) => {
    const blockedConnections = await Connection.find({
        status: "blocked",
        blockedBy: req.user._id,
    }).populate(
        "sender receiver",
        "username fullname avatar bio"
    );

    const blockedUsers = blockedConnections
        .map((connection) => {
            const senderId = connection.sender?._id;
            const blockedUser =
                String(senderId) === String(req.user._id)
                    ? connection.receiver
                    : connection.sender;

            if (!blockedUser?._id) {
                return null;
            }

            return {
                ...blockedUser.toObject(),
                connectionId: connection._id,
            };
        })
        .filter(Boolean);

    return res.status(200).json(
        new ApiResponse(
            200,
            blockedUsers,
            "Blocked users fetched successfully"
        )
    );
});

// Unblock user
const unblockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
        throw new ApiError(
            400,
            "You cannot unblock yourself"
        );
    }

    const connection = await Connection.findOne({
        status: "blocked",
        blockedBy: req.user._id,
        $or: [
            {
                sender: req.user._id,
                receiver: userId,
            },
            {
                sender: userId,
                receiver: req.user._id,
            },
        ],
    });

    if (!connection) {
        throw new ApiError(
            404,
            "Blocked connection not found"
        );
    }

    connection.status = "friend";
    connection.blockedBy = undefined;

    await connection.save();

    const io = req.app.get("io");

    if (io) {
        io.to(`user:${userId}`).emit("blockStatusChanged", {
            blockerId: String(req.user._id),
            blocked: false,
        });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "User unblocked successfully"
        )
    );
});

export {
    sendFriendRequest,
    getFriendRequests,
    getMyConnections,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    blockUser,
    unblockUser,
    getBlockedUsers,
};