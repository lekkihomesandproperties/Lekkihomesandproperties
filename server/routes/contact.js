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

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        message: "Please complete all required fields.",
      });
    }

    // Save the enquiry to MongoDB
    const savedMessage = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    // Send an email notification
    await transporter.sendMail({
      from: `"LekkiHomesAndProperties Website" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_RECEIVER,
      replyTo: email,
      subject: `New Website Enquiry: ${subject}`,
      text: `
You have received a new enquiry from your website.

Name: ${name}
Email: ${email}
Phone: ${phone}
Subject: ${subject}

Message:
${message}

Message ID: ${savedMessage._id}
      `,
    });

    return res.status(201).json({
      message: "Your message has been received successfully.",
    });
  } catch (error) {
    console.error("Contact form error:", error);

    return res.status(500).json({
      message: "Unable to process your message. Please try again later.",
    });
  }
});

module.exports = router;

