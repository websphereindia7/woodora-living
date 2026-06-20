require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const app = express();

/* CORS CONFIGURATION */

const allowedOrigins = [
  "https://woodora-living.netlify.app",
  "https://warm-parfait-9d78f4.netlify.app",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];

/* CORS CONFIGURATION */

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// app.options(/.*/, cors());

app.get("/", (req, res) => {
  res.status(200).send("Woodora Living backend is running");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const ContactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  requirement: String,
  message: String,
  status: {
    type: String,
    enum: ["New", "Contacted", "Closed"],
    default: "New",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Contact = mongoose.model("Contact", ContactSchema);

const ChatLeadSchema = new mongoose.Schema({
  whatsapp: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    default: "",
  },
  source: {
    type: String,
    default: "Chatbot",
  },
  status: {
    type: String,
    enum: ["New", "Contacted", "Closed"],
    default: "New",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ChatLead = mongoose.model("ChatLead", ChatLeadSchema);

/* BREVO EMAIL API */

const sendBrevoEmail = async ({ to, subject, html }) => {
  return axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: "Woodora Living",
        email: process.env.RECEIVER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      timeout: 10000,
    },
  );
};

/* ADMIN AUTH */

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/* ADMIN LOGIN */

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
    });
  }

  res.status(401).json({
    success: false,
    message: "Invalid username or password",
  });
});

/* CONTACT FORM */

app.post("/api/contact", async (req, res) => {
  try {
    const { name, phone, email, requirement, message } = req.body;

    const enquiry = new Contact({
      name,
      phone,
      email,
      requirement,
      message,
    });

    await enquiry.save();

    res.status(200).json({
      success: true,
      message: "Enquiry submitted successfully",
    });

    if (process.env.BREVO_API_KEY && process.env.RECEIVER_EMAIL) {
      sendBrevoEmail({
        to: process.env.RECEIVER_EMAIL,
        subject: `Woodora Living | New ${requirement} Enquiry`,
        html: `
          <div style="max-width:600px;margin:auto;font-family:Arial;">
            <div style="background:#7a5a39;color:white;padding:20px;">
              <h2>New Furniture Enquiry</h2>
            </div>
            <div style="padding:20px;">
              <p><b>Name:</b> ${name}</p>
              <p><b>Phone:</b> ${phone}</p>
              <p><b>Email:</b> ${email}</p>
              <p><b>Requirement:</b> ${requirement}</p>
              <p><b>Message:</b></p>
              <div style="background:#f8f8f8;padding:12px;">${message}</div>
            </div>
          </div>
        `,
      }).catch((error) => {
        console.error(
          "Owner email failed:",
          error.response?.data || error.message,
        );
      });

      sendBrevoEmail({
        to: email,
        subject: "Thank You for Contacting Woodora Living",
        html: `
          <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;border:1px solid #eee;border-radius:12px;overflow:hidden;">
            <div style="background:#7a5a39;color:white;padding:25px;">
              <h2 style="margin:0;">Thank You for Contacting Woodora Living</h2>
            </div>
            <div style="padding:30px;">
              <p>Hi <b>${name}</b>,</p>
              <p>Thank you for submitting your enquiry.</p>
              <p>We have received your request for:</p>
              <p><b>${requirement}</b></p>
              <p>Our team is reviewing your enquiry and we will get in touch with you as soon as possible.</p>
              <p>We appreciate your interest in Woodora Living.</p>
              <br>
              <p>Regards,<br>Woodora Living Team</p>
            </div>
            <div style="background:#fafafa;padding:16px;text-align:center;color:#777;">
              www.woodoraliving.com
            </div>
          </div>
        `,
      }).catch((error) => {
        console.error(
          "Customer email failed:",
          error.response?.data || error.message,
        );
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to submit enquiry",
    });
  }
});

/* SAVE CHATBOT LEAD */

app.post("/api/chat-leads", async (req, res) => {
  try {
    const { whatsapp, question } = req.body;

    if (!whatsapp) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp number is required",
      });
    }

    const chatLead = new ChatLead({
      whatsapp,
      question: question || "Question not available",
    });

    await chatLead.save();

    res.status(200).json({
      success: true,
      message: "Chat lead saved successfully",
    });

    if (process.env.BREVO_API_KEY && process.env.RECEIVER_EMAIL) {
      sendBrevoEmail({
        to: process.env.RECEIVER_EMAIL,
        subject: "Woodora Living | New Chatbot Lead",
        html: `
          <div style="max-width:600px;margin:auto;font-family:Arial,sans-serif;">
            <div style="background:#7a5a39;color:white;padding:20px;">
              <h2 style="margin:0;">New Chatbot Lead</h2>
            </div>
            <div style="padding:20px;border:1px solid #eee;">
              <p><b>WhatsApp:</b> ${whatsapp}</p>
              <p><b>Customer Question:</b></p>
              <div style="background:#f8f8f8;padding:12px;margin-bottom:15px;">
                ${question || "Question not available"}
              </div>
              <p><b>Status:</b> New</p>
              <p><b>Source:</b> Chatbot</p>
              <p><b>Date:</b> ${new Date().toLocaleString("en-IN")}</p>
            </div>
          </div>
        `,
      }).catch((error) => {
        console.error(
          "Chatbot email failed:",
          error.response?.data || error.message,
        );
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to save chat lead",
    });
  }
});

/* GET ENQUIRIES */

app.get("/api/enquiries", verifyAdmin, async (req, res) => {
  try {
    const enquiries = await Contact.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      enquiries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
});

/* GET CHATBOT LEADS */

app.get("/api/chat-leads", verifyAdmin, async (req, res) => {
  try {
    const chatLeads = await ChatLead.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      chatLeads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
});

/* UPDATE ENQUIRY STATUS */

app.put("/api/enquiries/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" },
    );

    res.json({
      success: true,
      updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
});

/* UPDATE CHAT LEAD STATUS */

app.put("/api/chat-leads/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await ChatLead.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" },
    );

    res.json({
      success: true,
      updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
});

/* START */

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
