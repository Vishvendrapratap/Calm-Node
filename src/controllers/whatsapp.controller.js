const WaChat = require("../models/WaChat");
const WaMessage = require("../models/WaMessage");

exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WA] verifyWebhook OK");
    return res.status(200).send(challenge);
  }

  console.log("[WA] verifyWebhook FAIL");
  return res.sendStatus(403);
};

exports.receiveWebhook = async (req, res) => {
  
  res.sendStatus(200);

  try {
    const body = req.body;

  
    console.log("[WA] webhook hit | hasEntry:", !!body?.entry);

    if (!body?.entry) return;

    for (const entry of body.entry) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value || {};
        const messages = value.messages || [];

        for (const msg of messages) {
          const waId = msg.from;
          const type = msg.type || "unknown";
          const messageId = msg.id || ""; 

          
          console.log(`[WA] IN | waId=${waId} | type=${type} | msgId=${messageId}`);

          if (!waId) continue;

          
          if (messageId) {
            const already = await WaMessage.findOne({ waMessageId: messageId });
            if (already) {
              console.log(`[WA] DUPLICATE ignored | msgId=${messageId}`);
              continue;
            }
          }

         
          const chat = await WaChat.findOneAndUpdate(
            { waId },
            {
              $setOnInsert: { waId, status: "ACTIVE", minimized: false },
              $set: { lastMessageAt: new Date() }
            },
            { new: true, upsert: true }
          );

         
          const messageDoc = {
            chatId: chat._id,
            waId,
            waMessageId: messageId,
            direction: "IN",
            type,
            raw: msg
          };

          if (type === "text") {
            messageDoc.text = msg.text?.body || "";
            chat.lastMessageText = messageDoc.text;
          } else if (type === "image") {
            messageDoc.media = {
              id: msg.image?.id || "",
              mimeType: msg.image?.mime_type || "",
              sha256: msg.image?.sha256 || "",
              caption: msg.image?.caption || "",
              filename: "",
              url: ""
            };
            chat.lastMessageText = "[image]";
          } else if (type === "document") {
            messageDoc.media = {
              id: msg.document?.id || "",
              mimeType: msg.document?.mime_type || "",
              filename: msg.document?.filename || "",
              sha256: msg.document?.sha256 || "",
              caption: msg.document?.caption || "",
              url: ""
            };
            chat.lastMessageText = `[document] ${messageDoc.media.filename || ""}`.trim();
          } else {
            chat.lastMessageText = `[${type}]`;
          }

          await WaMessage.create(messageDoc);
          await chat.save();

         
          console.log(`[WA] saved | chatId=${chat._id} | msgId=${messageId || "NA"}`);
        }
      }
    }
  } catch (err) {
    console.error("[WA] webhook error:", err.message);
  }
};

exports.listChats = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const { status, minimized } = req.query;
    const filter = {};
    if (status) filter.status = String(status).trim();
    if (minimized !== undefined) filter.minimized = minimized === "true";

    const [total, items] = await Promise.all([
      WaChat.countDocuments(filter),
      WaChat.find(filter).sort({ lastMessageAt: -1 }).skip(skip).limit(limit)
    ]);

    return res.status(200).json({ message: "Chats fetched", page, limit, total, items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch chats", error: err.message });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 200);

    const chat = await WaChat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const items = await WaMessage.find({ chatId }).sort({ createdAt: -1 }).limit(limit);
    return res.status(200).json({ message: "Messages fetched", chat, items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch messages", error: err.message });
  }
};

exports.updateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status, minimized } = req.body;

    const chat = await WaChat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (status !== undefined) chat.status = String(status).trim();
    if (minimized !== undefined) chat.minimized = Boolean(minimized);

    await chat.save();
    return res.status(200).json({ message: "Chat updated", chat });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update chat", error: err.message });
  }
};
