require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const inquiryRoutes = require("./routes/inquiry.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Calm Node backend running");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start", error);
    process.exit(1);
  }
};

startServer();