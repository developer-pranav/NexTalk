import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: ["text", "image", "video", "audio", "file"]
        },
        content: {
            type: String
        },
        attachments: {
            type: String,
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        },
        seenBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        isEdited: {
            type: Boolean,
            default: false
        },
        deleted: {
            type: Boolean,
            default: false
        },
    }, {
    timestamps: true
}
)

const Message = mongoose.model("Message", messageSchema)