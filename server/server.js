require('dotenv').config();

// const nodemailer = require("nodemailer");

const express=require('express');
const router = express.Router();

const mongoose=require('mongoose');
const path=require('path');
const Property = require('./models/Property');
const cors=require('cors');const rateLimit=require('express-rate-limit');
const app=express(); app.set('trust proxy',1);app.use(cors());app.use(express.json({limit:'1mb'}));app.use(express.urlencoded({extended:true}));app.use('/api/',rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}));app.use(express.static(path.join(__dirname,'../public')));app.get('/health',(req,res)=>res.json({ok:true,service:'LEKKIHOMESANDPROPERTIES API'}));


// Shareable property page for WhatsApp image previews
app.get('/share/property/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send('Property not found.');
    }

    const property = await Property.findOne({
      _id: req.params.id,
      isPublished: true
    }).lean();

    if (!property) {
      return res.status(404).send('Property not found.');
    }

    // Get the first available property image.
    const image =
      property.images?.find(url => typeof url === 'string' && url.trim()) ||
      property.image ||
      '';

    // Use your live website domain here after deployment.
    // Do not use localhost for WhatsApp previews.
    const siteUrl = `${req.protocol}://${req.get('host')}`;

    const absoluteImage = image
      ? new URL(image, siteUrl).href
      : `${siteUrl}/assets/default-property.jpg`;

    const title = property.title || 'Property for Sale or Rent';
    const location = property.location || 'Location available on request';

    const price =
      property.price !== undefined && property.price !== null
        ? `₦${Number(property.price).toLocaleString('en-NG')}`
        : 'Contact us for price';

    const description =
      `${title} in ${location}. Price: ${price}. ` +
      'Discover this property at LekkiHomesAndProperties.';

    // Escape text before inserting it into HTML.
    const escapeHtml = value =>
      String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]);

    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(description);
    const escapedImage = escapeHtml(absoluteImage);
    const escapedUrl = escapeHtml(
      `${siteUrl}/share/property/${property._id}`
    );

    res.set('Cache-Control', 'public, max-age=300');

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${escapedTitle} | LekkiHomesAndProperties</title>

  <meta name="description" content="${escapedDescription}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="LekkiHomesAndProperties">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDescription}">
  <meta property="og:image" content="${escapedImage}">
  <meta property="og:image:secure_url" content="${escapedImage}">
  <meta property="og:image:alt" content="${escapedTitle}">
  <meta property="og:url" content="${escapedUrl}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedDescription}">
  <meta name="twitter:image" content="${escapedImage}">

<meta http-equiv="refresh"
      content="3;url=/property-listings.html?property=${encodeURIComponent(String(property._id))}">



</head>

<body>
  <h1>${escapedTitle}</h1>
  <p>${escapedDescription}</p>

  <img
    src="${escapedImage}"
    alt="${escapedTitle}"
    style="max-width:100%;height:auto;"
  >

  <p>
    <a href="/property-listings.html?property=${encodeURIComponent(String(property._id))}">
      View Property Details
    </a>
  </p>
</body>
</html>`);

  } catch (error) {
    console.error('Property sharing page error:', error);
    res.status(500).send('Could not load property sharing page.');
  }
});app.use('/api/auth',require('./routes/auth'));app.use('/api/properties',require('./routes/properties'));

app.use('/api/contact',require('./routes/contact'));


app.use('/api/payments',require('./routes/payments'));app.use('/api/uploads',require('./routes/uploads'));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../public/index.html')));


const PORT=process.env.PORT||5000;
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/lekkihomesandproperties').then(async()=>{console.log('MongoDB connected');const User=require('./models/User');if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){const email=process.env.ADMIN_EMAIL.toLowerCase();const exists=await User.findOne({email});if(!exists){const bcrypt=require('bcryptjs');await User.create({name:process.env.ADMIN_NAME||'Administrator',email,password:await bcrypt.hash(process.env.ADMIN_PASSWORD,12),role:'admin'});console.log('Initial admin account created from environment settings.')}}app.listen(PORT,()=>console.log(`Website running at http://localhost:${PORT}`))}).catch(err=>{console.error('MongoDB connection failed:',err.message);process.exit(1)});

// Configure the email service



// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });
// // Contact form endpoint
// router.post("/contact", async (req, res) => {
//   try {
//     const { name, email, phone, message, subject } = req.body;

//     // Validate the submitted information
//     if (!name || !email || !phone || !message || !subject) {
//       return res.status(400).json({
//         success: false,
//         message: "Please complete all fields.",
//       });
//     }
//     // Send the enquiry to your business email
//     await transporter.sendMail({
//       from: `"LekkiHomesAndProperties Website" <${process.env.EMAIL_USER}>`,
//       to: process.env.CONTACT_RECEIVER,
//       replyTo: email,
//       subject: `New Customer Enquiry from ${name}`,
//       text: `
// New customer enquiry from your website.

// Customer Name: ${name}
// Customer Email: ${email}
// Customer Phone: ${phone}
// Customer Subject: ${subject}

// Message:
// ${message}
//       `,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Your message has been sent successfully!",
//     });
//   } catch (error) {
//     console.error("Contact form email error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to send your message. Please try again later.",
//     });
//   }
// });
// module.exports = router;


