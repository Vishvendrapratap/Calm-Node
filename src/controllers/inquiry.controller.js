const Inquiry = require("../models/Inquiry");


const makeInquiryId = async () => {
  const date = new Date();
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const prefix = `INQ-${y}${m}${d}-`;


  const countToday = await Inquiry.countDocuments({
    inquiryId: { $regex: `^${prefix}` },
  });

  const seq = String(countToday + 1).padStart(4, "0");
  return `${prefix}${seq}`;
};


exports.createInquiry = async (req, res) => {
  try {
    const { fullName, phone, email, documentType, state, metadata, notes, eta, fees } = req.body;

    if (!fullName || !phone || !email || !documentType || !state) {
      return res.status(400).json({
        message: "fullName, phone, email, documentType, state are required",
      });
    }

    const inquiryId = await makeInquiryId();

    const inquiry = await Inquiry.create({
      inquiryId,
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      documentType: String(documentType).trim(),
      state: String(state).trim(),
      metadata: metadata || { source: "website", remarks: "first inquiry" },
      notes: notes ? String(notes).trim() : "",

      eta: eta ? String(eta).trim() : "24 hrs",
      fees: fees !== undefined ? Number(fees) : 0,


      status: "START",
      nextActivity: "START",
    });

    return res.status(201).json({
      message: "Inquiry created",
      inquiry,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to create inquiry",
      error: err.message,
    });
  }
};


exports.listInquiries = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);

    const { status, state, documentType, phone, eta, fees } = req.query;

    const filter = {};
    if (status) filter.status = String(status).trim();
    if (state) filter.state = String(state).trim();
    if (documentType) filter.documentType = String(documentType).trim();
    if (phone) filter.phone = String(phone).trim();

    if(eta) filter.eta = String(eta).trim();
    if(fees !== undefined) filter.fees = Number(fees);

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      Inquiry.countDocuments(filter),
      Inquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({
      message: "Inquiries fetched",
      page,
      limit,
      total,
      items,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch inquiries",
      error: err.message,
    });
  }
};

exports.getInquiryActions = async (req, res) => {
  return res.status(200).json({
    message: "Actions fetched",
    items: [
      { key: "start", label: "Start" },
      { key: "request-docs", label: "Request document upload" }
    ]
  });
};


exports.updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, nextActivity, notes, eta, fees } = req.body;

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (status !== undefined) inquiry.status = String(status).trim();
    if (nextActivity !== undefined) inquiry.nextActivity = String(nextActivity).trim();
    if (notes !== undefined) inquiry.notes = String(notes).trim();

    if (eta !== undefined) inquiry.eta = String(eta).trim();
    if (fees !== undefined) inquiry.fees = Number(fees);

    await inquiry.save();

    return res.status(200).json({
      message: "Inquiry updated",
      inquiry,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to update inquiry",
      error: err.message,
    });
  }
};


exports.startInquiryAction = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    inquiry.status = "IN_PROGRESS";
    inquiry.nextActivity = "Call customer";
    if (!inquiry.notes) inquiry.notes = "Agent started the inquiry";

    await inquiry.save();

    return res.status(200).json({
      message: "Action applied: START",
      inquiry,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to apply action",
      error: err.message,
    });
  }
};


exports.requestDocsAction = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    inquiry.status = "IN_PROGRESS";
    inquiry.nextActivity = "Request document upload";
    inquiry.notes = inquiry.notes
      ? inquiry.notes
      : "Spoke to customer, waiting for docs";

    await inquiry.save();

    return res.status(200).json({
      message: "Action applied: REQUEST_DOCS",
      inquiry,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to apply action",
      error: err.message,
    });
  }
};