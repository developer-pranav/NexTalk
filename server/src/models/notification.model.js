import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        type: {
            type: String,
            enum: [
                "message",
                "friend_request",
                "friend_request_accepted",
            ],
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        conversation: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            default: null,
        },

        relatedMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },

        relatedConnection: {
            type: Schema.Types.ObjectId,
            ref: "Connection",
            default: null,
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model(
    "Notification",
    notificationSchema
);
