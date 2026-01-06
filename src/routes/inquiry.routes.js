const express = require("express");
const router = express.Router();

const inquiryController = require("../controllers/inquiry.controller");

router.post("/", inquiryController.createInquiry);
router.get("/", inquiryController.listInquiries);
router.get("/actions", inquiryController.getInquiryActions);

router.patch("/:id", inquiryController.updateInquiry);
router.patch("/:id/action/start", inquiryController.startInquiryAction);
router.patch("/:id/action/request-docs", inquiryController.requestDocsAction);

module.exports = router;
