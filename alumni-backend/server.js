const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const chatSocket = require("./socket/chatSocket");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const User = require("./models/User");

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS not allowed for this origin"));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.set("io", io);
chatSocket(io);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts. Please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Slow down and try again." },
});

app.use("/api", apiLimiter);

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const alumniRoutes = require("./routes/alumniRoutes");
const eventRoutes = require("./routes/eventRoutes");
const mentorshipRoutes = require("./routes/mentorshipRoutes");
const chatRoutes = require("./routes/chatRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

app.get("/", (req, res) => {
  res.send("AlumHub API is running...");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const LEGACY_USER_UNIQUE_INDEXES = ["email_1", "prn_1", "instituteCode_1"];

const ensureUserIndexes = async () => {
  try {
    const indexes = await User.collection.indexes();
    const indexNames = new Set(indexes.map((idx) => idx.name));

    for (const legacyIndex of LEGACY_USER_UNIQUE_INDEXES) {
      if (indexNames.has(legacyIndex)) {
        await User.collection.dropIndex(legacyIndex);
        console.log(`Dropped legacy user index: ${legacyIndex}`);
      }
    }

    await User.syncIndexes();
    console.log("User indexes are synced");
  } catch (error) {
    console.error("User index sync warning:", error.message);
  }
};

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    await ensureUserIndexes();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

startServer();
