import { User } from "../models/user.model.js";
import { Connection } from "../models/connection.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiReq.js";
import { ApiResponse } from "../utils/apiRes.js";


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
                receiver: userId
            },
            {
                sender: userId,
                receiver: req.user._id
            }
        ]
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
        status: "pending"
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            connection,
            "Friend request sent successfully"
        )
    );
});


const getFriendRequests = asyncHandler(async (req, res) => {

    const requests = await Connection.find({
        receiver: req.user._id,
        status: "pending"
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

    return res.status(200).json(
        new ApiResponse(
            200,
            request,
            "Friend request accepted"
        )
    );
});


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
                receiver: userId
            },
            {
                sender: userId,
                receiver: req.user._id
            }
        ]
    });

    if (connection) {

        if (connection.status === "blocked") {
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
            blockedBy: req.user._id
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
                receiver: userId
            },
            {
                sender: userId,
                receiver: req.user._id
            }
        ]
    });

    if (!connection) {
        throw new ApiError(
            404,
            "Blocked connection not found"
        );
    }

    await Connection.findByIdAndDelete(
        connection._id
    );

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
    acceptFriendRequest,
    rejectFriendRequest,
    blockUser,
    unblockUser
};