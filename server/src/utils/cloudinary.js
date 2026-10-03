import fs from "fs";
import cloudinary from "../config/cloudinary.js";

const uploadOnCloudinary = async (localFilePath, folder) => {
    try {
        if (!localFilePath) {
            console.error("No local file path provided");
            return null;
        }

        console.log("Uploading file to Cloudinary:", localFilePath);

        
        
        
        const extension = localFilePath.split(".").pop()?.toLowerCase();
        const rawExtensions = new Set([
            "json", "pdf", "txt", "csv", "doc", "docx", "xls", "xlsx",
            "ppt", "pptx", "zip", "rar", "7z", "apk", "js", "ts", "jsx",
            "tsx", "java", "py", "cpp", "c", "html", "css", "md", "xml"
        ]);

        const resourceType = rawExtensions.has(extension) ? "raw" : "auto";

        
        
        
        const response = resourceType === "raw"
            ? await cloudinary.uploader.upload_large(localFilePath, {
                folder: folder || "NexTalk/Avatar",
                resource_type: "raw",
                use_filename: true,
                unique_filename: true,
            })
            : await cloudinary.uploader.upload(localFilePath, {
                folder: folder || "NexTalk/Avatar",
                resource_type: resourceType,
            });

        console.log("Cloudinary upload successful:", response.secure_url);

        
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        console.error("ACTUAL CLOUDINARY ERROR:", error);
        console.error("Error message:", error.message);

        
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) {
            return false;
        }

        let cloudinaryResourceType = "image";

        if (resourceType === "video" || resourceType === "audio") {
            cloudinaryResourceType = "video";
        } else if (resourceType === "file" || resourceType === "raw") {
            cloudinaryResourceType = "raw";
        }

        const result = await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: cloudinaryResourceType,
                invalidate: true,
            }
        );

        console.log(
            `Cloudinary delete [${cloudinaryResourceType}]:`,
            publicId,
            result.result
        );

        return result.result === "ok" || result.result === "not found";
    } catch (error) {
        console.error(
            "Cloudinary delete error:",
            error.message
        );

        return false;
    }
};

const uploadBufferToCloudinary = async (buffer, folder, options = {}) => {
    try {
        if (!buffer || !Buffer.isBuffer(buffer) || !buffer.length) {
            console.error("No image buffer provided for Cloudinary upload");
            return null;
        }

        const dataUri = `data:${options.mimeType || "image/jpeg"};base64,${buffer.toString(
            "base64"
        )}`;

        const response = await cloudinary.uploader.upload(dataUri, {
            folder: folder || "NexTalk/Avatar",
            resource_type: "image",
            transformation: options.transformation,
        });

        console.log(
            "Cloudinary buffer upload successful:",
            response.secure_url
        );

        return response;
    } catch (error) {
        console.error(
            "Cloudinary buffer upload error:",
            error.message
        );

        return null;
    }
};

export {
    uploadOnCloudinary,
    deleteFromCloudinary,
    uploadBufferToCloudinary
};