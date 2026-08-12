import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "blocked"],
            required: true
        }
    },{
        timestamps: true
    }
)

const Connection = mongoose.model("Connection", connectionSchema)