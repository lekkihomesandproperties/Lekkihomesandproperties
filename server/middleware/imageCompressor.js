const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(__dirname, "../uploads");

// Create the uploads directory if it does not exist.
fs.mkdirSync(uploadDirectory, { recursive: true });

// Convert uploaded images to compressed WebP.
async function compressImages(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const optimizedImages = [];

    for (const file of req.files) {
      // Only accept actual image files.
      if (!file.mimetype || !file.mimetype.startsWith("image/")) {
        throw new Error("Only image files are allowed.");
      }

      // Generate a unique filename.
      const filename = `${crypto.randomUUID()}.webp`;
      const outputPath = path.join(uploadDirectory, filename);

      // Resize and compress the image.
      const result = await sharp(file.buffer, {
        limitInputPixels: 40000000
      })
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({
          quality: 82,
          effort: 4
        })
        .toFile(outputPath);

      optimizedImages.push({
        filename,
        path: outputPath,
        url: `/uploads/${filename}`,
        mimetype: "image/webp",
        size: result.size,
        width: result.width,
        height: result.height,
        originalSize: file.size,
        savedBytes: Math.max(0, file.size - result.size)
      });
    }

    // Make the optimized image information available to your route.
    req.optimizedImages = optimizedImages;

    next();
  } catch (error) {
    console.error("Image compression error:", error);

    // Clean up any images already created during a failed upload.
    if (req.optimizedImages) {
      for (const image of req.optimizedImages) {
        fs.promises.unlink(image.path).catch(() => {});
      }
    }

    res.status(400).json({
      success: false,
      message: "Image processing failed. Please try another image."
    });
  }
}

module.exports = compressImages;