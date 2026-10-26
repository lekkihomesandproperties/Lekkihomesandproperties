
const router = require('express').Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const auth = require('../middleware/auth');

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Accept JPG, PNG and WEBP images up to 5 MB each.
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error('Only JPG, PNG and WEBP images are allowed.')
      );
    }

    cb(null, true);
  }
});

// Upload one image per request.
// admin.js calls this endpoint separately for each selected image.
router.post('/property-image', auth, (req, res) => {
  if (!configured) {
    return res.status(503).json({
      message: 'Configure Cloudinary credentials in .env to enable image uploads.'
    });
  }

  upload.single('image')(req, res, async (err) => {
    if (err) {
      const status = err instanceof multer.MulterError ? 400 : 415;

      return res.status(status).json({
        message: err.message || 'Image upload failed.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Choose a JPG, PNG or WEBP image under 5 MB.'
      });
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'lekkihomesandproperties',
            resource_type: 'image',
            transformation: [
              {
                width: 1800,
                height: 1200,
                crop: 'limit'
              }
            ]
          },
          (uploadErr, uploadResult) => {
            if (uploadErr) {
              return reject(uploadErr);
            }

            resolve(uploadResult);
          }
        );

        stream.end(req.file.buffer);
      });

      if (!result || !result.secure_url) {
        return res.status(502).json({
          message: 'Cloudinary did not return an image URL.'
        });
      }

      return res.status(200).json({
        url: result.secure_url
      });

    } catch (error) {
      console.error('Cloudinary upload error:', error.message);

      return res.status(502).json({
        message: 'Cloudinary upload failed. Check your credentials and connection.'
      });
    }
  });
});

module.exports = router;





// const router = require('express').Router();
// const multer = require('multer');
// const { v2: cloudinary } = require('cloudinary');
// const auth = require('../middleware/auth');

// const configured = Boolean(
//   process.env.CLOUDINARY_CLOUD_NAME &&
//   process.env.CLOUDINARY_API_KEY &&
//   process.env.CLOUDINARY_API_SECRET
// );

// if (configured) {
//   cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
//   });
// }

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype));
//   }
// });

// router.post('/property-image', auth, (req, res) => {
//   if (!configured) {
//     return res.status(503).json({
//       message: 'Configure Cloudinary credentials in .env to enable secure image uploads.'
//     });
//   }

//   upload.single('image')(req, res, (err) => {
//     if (err) {
//       return res.status(400).json({ message: err.message || 'Image upload failed.' });
//     }
//     if (!req.file) {
//       return res.status(400).json({ message: 'Choose a JPG, PNG or WEBP image under 5 MB.' });
//     }

//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder: 'lekkihomesandproperties',
//         resource_type: 'image',
//         transformation: [{ width: 1800, height: 1200, crop: 'limit' }]
//       },
//       (uploadErr, result) => {
//         if (uploadErr) {
//           return res.status(502).json({ message: 'Cloudinary upload failed. Check your Cloudinary credentials.' });
//         }
//         return res.json({ url: result.secure_url });
//       }
//     );
//     stream.end(req.file.buffer);
//   });
// });

// module.exports = router;
