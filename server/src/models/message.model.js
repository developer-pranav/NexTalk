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
        media: {
            url: { type: String },
            publicId: { type: String },
            fileName: { type: String },
            fileSize: { type: Number },
            mimeType: { type: String },
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        },
        deliveredBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        seenBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        isEdited: {
            type: Boolean,
            default: false
        },
        editedAt: {
            type: Date
        },
        deleted: {
            type: Boolean,
            default: false
        },
    }, {
    timestamps: true
}
)

export const Message = mongoose.model("Message", messageSchema)