require('dotenv').config();

// const nodemailer = require("nodemailer");

const express=require('express');
const router = express.Router();

const mongoose=require('mongoose');
const path=require('path');
const Property = require('./models/Property');
const cors=require('cors');const rateLimit=require('express-rate-limit');
const app=express();app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);app.set('trust proxy',1);app.use(cors());


// app.use(express.json({limit:'1mb'}));
// Replace your current app.use(express.json({limit:'1mb'})); with this.
// Keep it BEFORE app.use('/api/payments', require('./routes/payments')).
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.split('?')[0] === '/api/payments/webhook') {
      req.rawBody = Buffer.from(buf);
    }
  }
}));app.use(express.urlencoded({extended:true}));app.use('/api/',rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}));app.use(express.static(path.join(__dirname,'../public')));app.get('/health',(req,res)=>res.json({ok:true,service:'LEKKIHOMESANDPROPERTIES API'}));


// Shareable property page for WhatsApp image previews
app.get('/share/property/:id', async (req, res) => {
  try {
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

    // Your official frontend domain
    const siteUrl = 'https://lekkihomesandproperties.com';

    // Get the first available property image
    const image =
      property.images?.find(
        url => typeof url === 'string' && url.trim()
      ) ||
      property.image ||
      '';

    // Use the absolute image URL when available
    const absoluteImage = image
      ? new URL(image, siteUrl).href
      : `${siteUrl}/assets/default-property.jpg`;

    const propertyUrl =
      `${siteUrl}/property-listings.html?property=` +
      encodeURIComponent(String(property._id));


      
    // Keep the sharing page URL on your official domain
    const shareUrl =
      `${siteUrl}/share/property/${property._id}`;

    const title =
      property.title || 'Property for Sale or Rent';

    const location =
      property.location || 'Location available on request';

    const price =
      property.price !== undefined && property.price !== null
        ? `₦${Number(property.price).toLocaleString('en-NG')}`
        : 'Contact us for price';

    const description =
      `${title} in ${location}. Price: ${price}. ` +
      'Discover this property at LekkiHomesAndProperties.';

    // Escape HTML values
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
    const escapedShareUrl = escapeHtml(shareUrl);
    const escapedPropertyUrl = escapeHtml(propertyUrl);

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
  <meta property="og:url" content="${escapedShareUrl}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedDescription}">
  <meta name="twitter:image" content="${escapedImage}">

  <meta http-equiv="refresh"
        content="3;url=${escapedPropertyUrl}">
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
    <a href="${escapedPropertyUrl}">
      View Property Details
    </a>
  </p>
</body>
</html>`);

  } catch (error) {
    console.error('Property sharing page error:', error);
    res.status(500).send('Could not load property sharing page.');
  }
});

// // Shareable property page for WhatsApp image previews
app.use('/api/auth',require('./routes/auth'));app.use('/api/properties',require('./routes/properties'));

app.use('/api/contact',require('./routes/contact'));


app.use('/api/payments',require('./routes/payments'));app.use('/api/uploads',require('./routes/uploads'));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../public/index.html')));





const PORT=process.env.PORT||5000;
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/lekkihomesandproperties').then(async()=>{console.log('MongoDB connected');const User=require('./models/User');if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){const email=process.env.ADMIN_EMAIL.toLowerCase();const exists=await User.findOne({email});if(!exists){const bcrypt=require('bcryptjs');await User.create({name:process.env.ADMIN_NAME||'Administrator',email,password:await bcrypt.hash(process.env.ADMIN_PASSWORD,12),role:'admin'});console.log('Initial admin account created from environment settings.')}}app.listen(PORT,()=>console.log(`Website running at http://localhost:${PORT}`))}).catch(err=>{console.error('MongoDB connection failed:',err.message);process.exit(1)});

// Configure the email service


