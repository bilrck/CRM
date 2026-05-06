import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// Initialize S3 Client
// This works with AWS S3, Cloudflare R2, DigitalOcean Spaces, or Supabase Storage
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT || undefined, // e.g., https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Uploads a buffer to an S3-compatible service.
 * @param {Buffer} buffer - The file buffer to upload
 * @param {string} mimeType - The mime type of the file (e.g., 'image/jpeg')
 * @param {string} originalName - Optional original file name to aid in extension mapping
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadToS3 = async (buffer, mimeType, originalName = "") => {
  // If S3 keys are not configured, fallback to Mock Mode (for local development without cloud)
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_BUCKET_NAME) {
    console.warn(
      "⚠️ AWS S3 Configuration missing. Media upload skipped. Set AWS_ACCESS_KEY_ID and AWS_BUCKET_NAME to enable Scalable Storage.",
    );
    return null;
  }

  try {
    const bucketName = process.env.AWS_BUCKET_NAME;

    // Determine extension
    let extension = mimeType.split("/")[1] || "bin";
    if (extension.includes(";")) extension = extension.split(";")[0];

    // Some common mime fixes
    if (extension === "jpeg") extension = "jpg";
    if (extension === "mpga") extension = "mp3";
    if (extension === "quicktime") extension = "mov";

    // Generate unique random filename
    const uniqueId = uuidv4();
    const datePrefix = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `media/${datePrefix}/${uniqueId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
      // ACL: 'public-read', // Uncomment if bucket ACLs strictly require it, otherwise Bucket Policy handles it
    });

    await s3Client.send(command);

    // Construct Public URL
    // If using Cloudflare R2 or a custom Custom Domain, use AWS_PUBLIC_URL_PREFIX
    // Otherwise construct default AWS URL
    let publicUrl = "";
    if (process.env.AWS_PUBLIC_URL_PREFIX) {
      publicUrl = `${process.env.AWS_PUBLIC_URL_PREFIX}/${fileName}`;
    } else {
      // Default AWS S3 template
      publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    }

    return publicUrl;
  } catch (error) {
    console.error("❌ Erro no Upload S3:", error);
    return null;
  }
};

/**
 * Helper to extract Base64 payload from Evolution Message
 */
export const getEvolutionMediaBuffer = async (
  instanceName,
  messageId,
  evolutionUrl,
  evolutionKey,
) => {
  try {
    const response = await fetch(
      `${evolutionUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionKey,
        },
        body: JSON.stringify({ message: { key: { id: messageId } } }),
      },
    );

    if (!response.ok) {
      throw new Error(`Evolution API Error: ${response.status}`);
    }

    const data = await response.json();
    if (data.base64) {
      // Convert Base64 string to Buffer
      let b64str = data.base64;
      if (b64str.includes("base64,")) {
        b64str = b64str.split("base64,")[1];
      }
      return Buffer.from(b64str, "base64");
    }
    return null;
  } catch (err) {
    console.error("Erro ao buscar mídia do Evolution:", err);
    return null;
  }
};

import fs from "fs";
import path from "path";

/**
 * Saves a buffer locally, organized by workspace and date.
 */
export const saveMediaLocally = async (buffer, mimeType, workspaceId) => {
  try {
    const datePrefix = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      String(workspaceId),
      datePrefix,
    );

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Determine extension
    let extension = mimeType.split("/")[1] || "bin";
    if (extension.includes(";")) extension = extension.split(";")[0];
    if (extension === "jpeg") extension = "jpg";
    if (extension === "mpga") extension = "mp3";
    if (extension === "quicktime") extension = "mov";

    const uniqueId = uuidv4();
    const fileName = `${uniqueId}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    // Return relative path for URL (assuming /uploads is statically served)
    return `/uploads/${workspaceId}/${datePrefix}/${fileName}`;
  } catch (error) {
    console.error("❌ Erro ao salvar mídia localmente:", error);
    return null;
  }
};

/**
 * Unified helper to fetch media from Evolution and store it (S3 or Locally)
 */
export const processAndStoreMedia = async (
  instanceName,
  messageId,
  type,
  messageContent,
  workspaceId,
) => {
  const EVO_URL = process.env.EVOLUTION_API_URL;
  const EVO_GLOBAL_KEY = process.env.EVOLUTION_API_KEY;

  if (!instanceName || !messageId || !EVO_URL || !EVO_GLOBAL_KEY) {
    return { url: null, mimeType: null };
  }

  try {
    const buffer = await getEvolutionMediaBuffer(
      instanceName,
      messageId,
      EVO_URL,
      EVO_GLOBAL_KEY,
    );
    if (!buffer) return { url: null, mimeType: null };

    // Extract MimeType
    let mime = "application/octet-stream";
    if (type === "image")
      mime = messageContent.imageMessage?.mimetype || "image/jpeg";
    else if (type === "video")
      mime = messageContent.videoMessage?.mimetype || "video/mp4";
    else if (type === "audio")
      mime = messageContent.audioMessage?.mimetype || "audio/ogg";
    else if (type === "document")
      mime = messageContent.documentMessage?.mimetype || "application/pdf";
    else if (type === "sticker")
      mime = messageContent.stickerMessage?.mimetype || "image/webp";

    // Try S3 first if configured
    let mediaUrl = await uploadToS3(buffer, mime);

    // Fallback to Local Storage if S3 is not available
    if (!mediaUrl && workspaceId) {
      mediaUrl = await saveMediaLocally(buffer, mime, workspaceId);
      if (mediaUrl) {
        console.log(`[Storage] Mídia salva localmente: ${mediaUrl}`);
      }
    }

    return { url: mediaUrl, mimeType: mime };
  } catch (err) {
    console.error("[processAndStoreMedia] Error:", err);
    return { url: null, mimeType: null };
  }
};
