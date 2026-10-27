const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
try {
const { name, email, phone, message, subject } = req.body;

if (!name || !email || !phone || !message || !subject) {
  return res.status(400).json({
    success: false,
    message: "Please complete all fields.",
  });
}

if (!process.env.RESEND_API_KEY || !process.env.CONTACT_RECEIVER) {
  console.error("Missing Resend configuration.");

  return res.status(500).json({
    success: false,
    message: "Email service is not configured.",
  });
}

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
console.error("Contact form error:", error.message);

return res.status(500).json({
  success: false,
  message: "Unable to send your message. Please try again later.",
});
}
});

module.exports = router;