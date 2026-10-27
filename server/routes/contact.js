// const router=require('express').Router();const ContactMessage=require('../models/ContactMessage');router.post('/',async(req,res)=>{try{const {name,email,phone,subject,message}=req.body;if(!name||!email||!phone||!subject||!message)return res.status(400).json({message:'Please complete all required fields.'});await ContactMessage.create({name,email,phone,subject,message});res.status(201).json({message:'Message received.'})}catch{res.status(500).json({message:'Unable to send message.'})}});module.exports=router;



const router = require("express").Router();
const nodemailer = require("nodemailer");
const ContactMessage = require("../models/ContactMessage");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});





// router.post("/", async (req, res) => {
//   try {
//     const { name, email, phone, subject, message } = req.body;

//     if (!name || !email || !phone || !subject || !message) {
//       return res.status(400).json({
//         message: "Please complete all required fields.",
//       });
//     }

//     // Save the enquiry to MongoDB
//     const savedMessage = await ContactMessage.create({
//       name,
//       email,
//       phone,
//       subject,
//       message,
//     });

//     // Send an email notification
//     await transporter.sendMail({
//       from: `"LekkiHomesAndProperties Website" <${process.env.EMAIL_USER}>`,
//       to: process.env.CONTACT_RECEIVER,
//       replyTo: email,
//       subject: `New Website Enquiry: ${subject}`,
//       text: `
// You have received a new enquiry from your website.

// Name: ${name}
// Email: ${email}
// Phone: ${phone}
// Subject: ${subject}

// Message:
// ${message}

// Message ID: ${savedMessage._id}
//       `,
//     });

//     return res.status(201).json({
//       message: "Your message has been received successfully.",
//     });
//   } catch (error) {
//     console.error("Contact form error:", error);

//     return res.status(500).json({
//       message: "Unable to process your message. Please try again later.",
//     });
//   }
// });

// module.exports = router;



// Contact form endpoint using Resend API
router.post("/contact", async (req, res) => {
  try {
    const { name, email, phone, message, subject } = req.body;

    // Validate the submitted information
    if (!name || !email || !phone || !message || !subject) {
      return res.status(400).json({
        success: false,
        message: "Please complete all fields.",
      });
    }

    // Check required environment variables
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_RECEIVER) {
      console.error("Missing Resend or contact receiver configuration.");

      return res.status(500).json({
        success: false,
        message: "Email service is not configured.",
      });
    }

    // Send the enquiry using Resend's HTTPS API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LekkiHomesAndProperties <onboarding@resend.dev>",
        to: [process.env.CONTACT_RECEIVER],
        reply_to: email,
        subject: `New Customer Enquiry: ${subject}`,
        text: `
New customer enquiry from your website.

Customer Name: ${name}
Customer Email: ${email}
Customer Phone: ${phone}
Customer Subject: ${subject}

Message:
${message}
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", response.status, result);

      return res.status(502).json({
        success: false,
        message: "Unable to send your message. Please try again later.",
      });
    }

    console.log("Contact form email accepted by Resend:", result.id);

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (error) {
    console.error("Contact form email error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send your message. Please try again later.",
    });
  }
});

module.exports = router;