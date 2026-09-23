import fs from "fs";
import cloudinary from "../config/cloudinary.js";

const uploadOnCloudinary = async (localFilePath, folder) => {
    try {
        if (!localFilePath) {
            console.error("No local file path provided");
            return null;
        }

        console.log("Uploading file to Cloudinary:", localFilePath);

        // Cloudinary's `auto` resource type can reject some non-media
        // document MIME types (e.g. application/json). Upload those as
        // raw resources while keeping images/videos/audio on auto.
        const extension = localFilePath.split(".").pop()?.toLowerCase();
        const rawExtensions = new Set([
            "json", "pdf", "txt", "csv", "doc", "docx", "xls", "xlsx",
            "ppt", "pptx", "zip", "rar", "7z", "apk", "js", "ts", "jsx",
            "tsx", "java", "py", "cpp", "c", "html", "css", "md", "xml"
        ]);

        const resourceType = rawExtensions.has(extension) ? "raw" : "auto";

        // Cloudinary's raw uploader is the most reliable path for arbitrary
        // documents such as JSON. `upload_large` also preserves the raw
        // resource type automatically and avoids format-detection issues.
        const response = resourceType === "raw"
            ? await cloudinary.uploader.upload_large(localFilePath, {
                folder: folder || "TalkVerse/Avatar",
                resource_type: "raw",
                use_filename: true,
                unique_filename: true,
            })
            : await cloudinary.uploader.upload(localFilePath, {
                folder: folder || "TalkVerse/Avatar",
                resource_type: resourceType,
            });

        console.log("Cloudinary upload successful:", response.secure_url);

        // Delete temporary file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        console.error("ACTUAL CLOUDINARY ERROR:", error);
        console.error("Error message:", error.message);

        // Delete temporary file after failed upload
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

export { uploadOnCloudinary };