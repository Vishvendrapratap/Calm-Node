const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/whatsapp.controller");


router.get("/webhook", ctrl.verifyWebhook);
router.post("/webhook", ctrl.receiveWebhook);


router.get("/admin/chats", ctrl.listChats);
router.get("/admin/chats/:chatId/messages", ctrl.getChatMessages);
router.patch("/admin/chats/:chatId", ctrl.updateChat);

router.post("/admin/chats/:chatId/messages/mock", ctrl.mockSendMessage);


module.exports = router;
