const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "dev_secret";

  return jwt.sign(
    { id: user._id, phone: user.phone, role: user.role },
    secret,
    { expiresIn: "7d" }
  );
};

const generateOtpCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

/**
 * ------------------------------------------------------------------
 * NOTE:
 * Currently OTP is generated and logged in server console (DEV mode).
 * This is intentional for local development and testing.
 *
 * In production, this can be easily integrated with any
 * third-party SMS provider
 *
 * No third-party dependency is added at this stage.
 * ------------------------------------------------------------------
 */

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "phone is required" });
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ phone });
    await Otp.create({ phone, code, expiresAt });

    console.log(`OTP for ${phone} is: ${code}`);

    return res.status(200).json({
      message: "OTP SENT (DEV mode: check server console)",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to send OTP",
      error: err.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code, name } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ message: "phone and code are required" });
    }

    const otpDoc = await Otp.findOne({ phone, code });

    if (!otpDoc) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(401).json({ message: "OTP expired" });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: name || "" });
    }

    const token = generateToken(user);

    await Otp.deleteMany({ phone });

    return res.status(200).json({
      message: "OTP verified",
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to verify OTP",
      error: err.message,
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email and password are required",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (!cleanName) {
      return res.status(400).json({ message: "name is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }


    if (phone) {
      const existingPhone = await User.findOne({ phone: String(phone).trim() });
      if (existingPhone) {
        return res.status(409).json({ message: "Phone already registered" });
      }
    }


    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      phone: phone ? String(phone).trim() : undefined,
      role: "USER",
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      const field =
        Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
      return res.status(409).json({ message: `${field} already exists` });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

