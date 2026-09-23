import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["direct", "group"],
            required: true
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],

        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        },

        groupName: {
            type: String,
            trim: true
        },

        groupAvatar: {
            type: String
        },

        description: {
            type: String,
            trim: true
        },

        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

export const Conversation = mongoose.model("Conversation", conversationSchema)