import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


/**
 * Uploads a PDF file to Cloudinary and returns the response.
 * @param {string} pdfPath The local path of the PDF file.
 * @param {string} pdfName The name to give the PDF file in Cloudinary.
 * @returns {Object} The response from Cloudinary, or null if the upload fails.
 */
export const uploadPDFToCloudinary = async (_userId, pdfPath, pdfName) => {
    try {
        console.log("Uploading PDF to Cloudinary...", _userId);
        const userId = _userId.toString();
        if (!pdfPath || !pdfName) {
            console.error("Missing PDF path or name.");
            return null;
        }

        // Upload the PDF file to Cloudinary
        const response = await cloudinary.uploader.upload(pdfPath, {
            resource_type: "raw",
            public_id: `pdfs/${userId}/${pdfName}`, // Store it inside the 'pdfs' folder in Cloudinary
        });

        console.log("Cloudinary Upload Response:", response);

        // Remove the local file after successful upload
        fs.unlinkSync(pdfPath);

        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        
        // Remove the local file if upload fails
        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
        }

        return null;
    }
};