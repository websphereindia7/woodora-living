/* =========================================================
   PURPOSE:
   Handles Woodora chatbot replies, typing indicator, quick replies,
   WhatsApp lead capture, confirmation card, and sends chatbot leads
   to MongoDB through backend API.

   USED IN:
   assets/js/chatbot.js

   BACKEND API USED:
   POST https://woodora-living.onrender.com/api/chat-leads
========================================================= */

const CHATBOT_API_BASE_URL = "https://woodora-living.onrender.com";

const chatbotToggle = document.getElementById("chatbotToggle");
const chatbotBox = document.getElementById("chatbotBox");
const chatbotClose = document.getElementById("chatbotClose");
const chatbotMessages = document.getElementById("chatbotMessages");
const chatbotInput = document.getElementById("chatbotInput");
const chatbotSend = document.getElementById("chatbotSend");

const MIN_TYPING_DELAY = 2500;
const MAX_TYPING_DELAY = 6500;
const TYPING_SPEED_PER_CHARACTER = 35;

const BOT_REPLY_DELAY = 4500;
let botIsTyping = false;

let waitingForWhatsapp = false;
let leadSubmitted = false;
let lastUnansweredQuestion = "";

function getTypingDelay(message) {
  const randomExtraDelay = Math.floor(Math.random() * 900);
  const estimatedDelay = message.length * TYPING_SPEED_PER_CHARACTER;

  return Math.min(
    MAX_TYPING_DELAY,
    Math.max(MIN_TYPING_DELAY, estimatedDelay + randomExtraDelay),
  );
}

const chatbotFAQs = [
  {
    keywords: ["custom", "customize", "customized", "made to order"],
    answer:
      "Yes, we provide custom furniture solutions based on your room size, style, finish, and requirement.",
  },

  {
    keywords: [
      "sofa",
      "sofas",
      "couch",
      "recliner",
      "recliners",
      "lounge chair",
      "accent chair",
    ],
    answer:
      "We offer premium sofas, recliners, lounge chairs, and custom seating options for living rooms.",
  },

  {
    keywords: ["bed", "beds", "bedroom"],
    answer:
      "Yes, we offer bedroom furniture including beds, wardrobes, side tables, dressing tables, and storage solutions.",
  },

  {
    keywords: ["dining", "dining table", "dining set"],
    answer:
      "We provide dining tables and dining sets in different sizes, finishes, and premium designs.",
  },

  {
    keywords: ["wardrobe", "wardrobes", "storage", "cupboard"],
    answer:
      "Yes, we offer wardrobes, storage cabinets, modular storage solutions, and customized layouts.",
  },

  {
    keywords: ["tv unit", "tv units", "tv cabinet", "entertainment unit"],
    answer:
      "Yes, we provide TV units, console units, wall-mounted TV panels, and storage-based entertainment units.",
  },

  {
    keywords: ["office", "desk", "chair", "workspace"],
    answer:
      "Yes, we provide office furniture such as desks, chairs, storage units, and workspace furniture.",
  },

  {
    keywords: ["small space", "small home", "compact", "apartment"],
    answer:
      "Yes, we provide space-saving furniture ideas for apartments, compact homes, and small rooms.",
  },

  {
    keywords: [
      "material",
      "wood",
      "wood type",
      "color",
      "colour",
      "finish",
      "polish",
    ],
    answer:
      "Our furniture is available in different materials, wood finishes, polish options, fabrics, and color tones based on your requirement.",
  },

  {
    keywords: ["measurement", "measurements", "room size", "size"],
    answer:
      "Furniture size can be planned according to your room measurements. You can share room dimensions with our team for guidance.",
  },

  {
    keywords: [
      "price",
      "cost",
      "rate",
      "charges",
      "quotation",
      "quote",
      "estimate",
    ],
    answer:
      "Pricing depends on furniture type, size, material, finish, and customization. Please share your requirement for an accurate quotation.",
  },

  {
    keywords: ["delivery", "deliver", "shipping", "delivery time", "how long"],
    answer:
      "Delivery support is available. Timeline depends on product type, customization level, order size, and location.",
  },

  {
    keywords: ["installation", "assembly", "setup"],
    answer:
      "Yes, installation and setup support can be provided depending on the furniture category and order requirement.",
  },

  {
    keywords: [
      "consultation",
      "design",
      "interior",
      "design help",
      "space planning",
    ],
    answer:
      "Yes, our team helps with furniture consultation, room layouts, furniture selection, and design guidance.",
  },

  {
    keywords: [
      "showroom",
      "visit",
      "location",
      "address",
      "mumbai",
      "thane",
      "navi mumbai",
    ],
    answer:
      "Woodora Living is based in Mumbai. Please contact our team to confirm showroom visit details, delivery, or service availability for your location.",
  },

  {
    keywords: ["catalog", "catalogue", "brochure", "designs"],
    answer:
      "You can explore furniture designs on our website. For more options, our team can suggest suitable designs based on your requirement.",
  },

  {
    keywords: [
      "order",
      "booking",
      "place order",
      "contact",
      "phone",
      "call",
      "whatsapp",
    ],
    answer:
      "You can start by submitting the contact form or contacting us through WhatsApp. Our team will guide you with selection, quotation, and booking.",
  },

  {
    keywords: [
      "warranty",
      "guarantee",
      "service",
      "after sales",
      "support",
      "maintenance",
      "cleaning",
      "care",
    ],
    answer:
      "Warranty, service, and care guidance depend on the furniture category and material. Our team can share exact details for your selected product.",
  },
];

const quickReplies = [
  "Custom furniture",
  "Sofa options",
  "Wardrobes",
  "TV units",
  "Price range",
  "Delivery",
];

/* =========================================================
   PURPOSE:
   Open and close chatbot window
========================================================= */

if (chatbotToggle && chatbotBox) {
  chatbotToggle.addEventListener("click", () => {
    chatbotBox.classList.toggle("active");
  });
}

if (chatbotClose && chatbotBox) {
  chatbotClose.addEventListener("click", () => {
    chatbotBox.classList.remove("active");
  });
}

/* =========================================================
   PURPOSE:
   Send customer message using button click or Enter key
========================================================= */

if (chatbotSend) {
  chatbotSend.addEventListener("click", () => {
    handleUserMessage();
  });
}

if (chatbotInput) {
  chatbotInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleUserMessage();
    }
  });
}

if (chatbotMessages) {
  createQuickReplies();
}

/* =========================================================
   PURPOSE:
   Main message handler for customer chat
========================================================= */

function handleUserMessage(customText = "") {
  if (botIsTyping) return;

  const userText = customText || chatbotInput.value.trim();

  if (!userText) return;

  addMessage(userText, "user-message");

  if (chatbotInput) {
    chatbotInput.value = "";
  }

  if (waitingForWhatsapp) {
    captureWhatsappNumber(userText);
    return;
  }

  const botReply = getBotReply(userText);
  const typingDelay = getTypingDelay(botReply.answer);

  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();

    addMessage(botReply.answer, "bot-message");

    if (botReply.askWhatsapp && !leadSubmitted) {
      waitingForWhatsapp = true;
      lastUnansweredQuestion = userText;

      const whatsappMessage =
        "Please type your WhatsApp number here and our team will contact you shortly.";

      addMessage(whatsappMessage, "bot-message");
    }
  }, typingDelay);
}

/* =========================================================
   PURPOSE:
   Match customer question with predefined FAQ answers
========================================================= */

function getBotReply(userText) {
  const message = userText.toLowerCase();

  const matchedFAQ = chatbotFAQs.find((faq) => {
    return faq.keywords.some((keyword) => message.includes(keyword));
  });

  if (matchedFAQ) {
    return {
      answer: matchedFAQ.answer,
      askWhatsapp: false,
    };
  }

  if (leadSubmitted) {
    return {
      answer:
        "Our team has already received your details. You can continue asking furniture-related questions here.",
      askWhatsapp: false,
    };
  }

  return {
    answer: "Sorry, I could not find an exact answer for this question.",
    askWhatsapp: true,
  };
}

/* =========================================================
   PURPOSE:
   Validate WhatsApp number, save lead to backend, and show confirmation
========================================================= */

async function captureWhatsappNumber(userText) {
  const cleanedNumber = userText.replace(/\D/g, "");

  if (cleanedNumber.length < 10 || cleanedNumber.length > 13) {
    addMessage("Please enter a valid WhatsApp number.", "bot-message");
    return;
  }

  waitingForWhatsapp = false;
  leadSubmitted = true;

  hideQuickReplies();

  showTypingIndicator();

  const isSaved = await saveChatLeadToBackend(
    cleanedNumber,
    lastUnansweredQuestion,
  );

  setTimeout(() => {
    removeTypingIndicator();

    if (isSaved) {
      showLeadConfirmation();
      showPostSubmitActions();
    } else {
      addMessage(
        "Your number was received, but we could not save it right now. Please use the Contact Us form if needed.",
        "bot-message",
      );
    }
  }, BOT_REPLY_DELAY);
}

/* =========================================================
   PURPOSE:
   Send captured WhatsApp lead to backend MongoDB API
========================================================= */

async function saveChatLeadToBackend(whatsapp, question) {
  try {
    const response = await fetch(`${CHATBOT_API_BASE_URL}/api/chat-leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        whatsapp,
        question: question || "Question not available",
      }),
    });

    const data = await response.json();

    return data.success === true;
  } catch (error) {
    console.log("Chat lead save error:", error);
    return false;
  }
}

/* =========================================================
   PURPOSE:
   Show confirmation card after successful lead submission
========================================================= */

function showLeadConfirmation() {
  const confirmationCard = document.createElement("div");

  confirmationCard.className = "bot-message lead-confirmation";

  confirmationCard.innerHTML = `
    <strong>✓ Request Submitted</strong>
    <span>Our team has received your details.</span>
    <span><b>Expected response:</b> Within 24 hours</span>
    <span>Thank you for contacting Woodora Living.</span>
  `;

  chatbotMessages.appendChild(confirmationCard);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

/* =========================================================
   PURPOSE:
   Show Continue Chat and Close Chat buttons after lead capture
========================================================= */

function showPostSubmitActions() {
  const actionWrapper = document.createElement("div");

  actionWrapper.className = "post-submit-actions";
  actionWrapper.id = "postSubmitActions";

  actionWrapper.innerHTML = `
    <button type="button" id="continueChatBtn">Continue Chat</button>
    <button type="button" id="closeChatBtn">Close Chat</button>
  `;

  chatbotMessages.appendChild(actionWrapper);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

  document.getElementById("continueChatBtn").addEventListener("click", () => {
    actionWrapper.remove();
    createQuickReplies();

    addMessage(
      "Sure, you can continue asking your furniture-related questions.",
      "bot-message",
    );
  });

  document.getElementById("closeChatBtn").addEventListener("click", () => {
    chatbotBox.classList.remove("active");
  });
}

/* =========================================================
   PURPOSE:
   Add user or bot message to chat area
========================================================= */

function addMessage(text, className) {
  const messageDiv = document.createElement("div");

  messageDiv.className = className;
  messageDiv.textContent = text;

  chatbotMessages.appendChild(messageDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

/* =========================================================
   PURPOSE:
   Show and remove typing indicator
========================================================= */

function showTypingIndicator() {
  botIsTyping = true;

  const typingDiv = document.createElement("div");

  typingDiv.className = "bot-message typing-indicator";
  typingDiv.id = "typingIndicator";
  typingDiv.textContent = "Kumar is typing...";

  chatbotMessages.appendChild(typingDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");

  if (typingIndicator) {
    typingIndicator.remove();
  }

  botIsTyping = false;
}

/* =========================================================
   PURPOSE:
   Create quick reply buttons
========================================================= */

function createQuickReplies() {
  if (!chatbotMessages) return;

  if (document.querySelector(".quick-replies")) return;

  const quickReplyWrapper = document.createElement("div");

  quickReplyWrapper.className = "quick-replies";

  quickReplies.forEach((reply) => {
    const button = document.createElement("button");

    button.textContent = reply;

    button.addEventListener("click", () => {
      handleUserMessage(reply);
    });

    quickReplyWrapper.appendChild(button);
  });

  chatbotMessages.appendChild(quickReplyWrapper);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

/* =========================================================
   PURPOSE:
   Hide quick replies after lead submission
========================================================= */

function hideQuickReplies() {
  const quickReplyWrapper = document.querySelector(".quick-replies");

  if (quickReplyWrapper) {
    quickReplyWrapper.remove();
  }
}
