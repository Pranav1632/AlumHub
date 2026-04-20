const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");
const net = require("net");
const { spawn } = require("child_process");
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

const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  "https://alumhub.vercel.app,http://localhost:5173,http://127.0.0.1:5173"
)
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
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.get("/", (req, res) => {
  res.send("AlumHub API is running...");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    mongoState: mongoose.connection.readyState,
  });
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
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const DEFAULT_LOCAL_MONGO_BIN = "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe";
const DEFAULT_LOCAL_MONGO_DBPATH = path.join(__dirname, "mongodb-data");
const DEFAULT_LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/alumniDB";
const MONGO_RECOVERY_INTERVAL_MS = Number(process.env.MONGO_RECOVERY_INTERVAL_MS || 10000);
const PRIMARY_MONGO_URI = String(process.env.MONGO_URI || DEFAULT_LOCAL_MONGO_URI);
const LOCAL_MONGO_URI = String(process.env.LOCAL_MONGO_URI || DEFAULT_LOCAL_MONGO_URI);

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let mongoRecoveryTimer = null;
let mongoRecoveryInProgress = false;
let activeMongoUri = PRIMARY_MONGO_URI;

const isLocalMongoUri = (uri = "") => uri.includes("127.0.0.1:27017") || uri.includes("localhost:27017");

const isTruthyEnvFlag = (value, defaultValue = "true") => {
  const normalized = String(value ?? defaultValue).toLowerCase();
  return !(normalized === "false" || normalized === "0" || normalized === "no");
};

const isMongoPortReachable = (host = "127.0.0.1", port = 27017, timeoutMs = 1200) =>
  new Promise((resolve) => {
    const socket = net.connect({ host, port });

    const cleanup = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.on("connect", () => cleanup(true));
    socket.on("timeout", () => cleanup(false));
    socket.on("error", () => cleanup(false));
  });

const shouldTryAutoStartMongo = (uri = activeMongoUri) =>
  isTruthyEnvFlag(process.env.AUTO_START_LOCAL_MONGO, "true") && isLocalMongoUri(uri);

const shouldAllowLocalFallback = () => isTruthyEnvFlag(process.env.ALLOW_LOCAL_MONGO_FALLBACK, "true");

const tryAutoStartLocalMongo = async () => {
  if (!(await isMongoPortReachable("127.0.0.1", 27017))) {
    const mongoBin = process.env.LOCAL_MONGO_BIN || DEFAULT_LOCAL_MONGO_BIN;
    const dbPath = process.env.LOCAL_MONGO_DBPATH || DEFAULT_LOCAL_MONGO_DBPATH;
    const logPath = process.env.LOCAL_MONGO_LOGPATH || path.join(dbPath, "mongod.log");

    if (!fs.existsSync(mongoBin)) {
      console.error(`Auto-start skipped: mongod binary not found at ${mongoBin}`);
      return false;
    }

    try {
      fs.mkdirSync(dbPath, { recursive: true });
    } catch (mkdirError) {
      console.error("Auto-start failed: unable to prepare local MongoDB dbpath.", mkdirError.message);
      return false;
    }

    try {
      const args = ["--dbpath", dbPath, "--bind_ip", "127.0.0.1", "--port", "27017", "--logpath", logPath];
      const child = spawn(mongoBin, args, {
        detached: true,
        windowsHide: true,
        stdio: "ignore",
      });
      child.unref();
      console.log(`Attempted local MongoDB auto-start with dbPath: ${dbPath}`);
    } catch (spawnError) {
      console.error("Auto-start failed: could not spawn mongod.", spawnError.message);
      return false;
    }

    await sleep(3500);
  }

  return isMongoPortReachable("127.0.0.1", 27017);
};

const trySwitchToLocalFallback = async (reasonText = "unknown-error") => {
  if (!shouldAllowLocalFallback() || isLocalMongoUri(activeMongoUri)) return false;

  console.warn(`Primary MongoDB URI failed (${reasonText}). Trying local fallback...`);

  let localReachable = await isMongoPortReachable("127.0.0.1", 27017);
  if (!localReachable && shouldTryAutoStartMongo(LOCAL_MONGO_URI)) {
    localReachable = await tryAutoStartLocalMongo();
  }

  if (!localReachable) {
    console.error("Local fallback unavailable: MongoDB is not reachable on 127.0.0.1:27017.");
    return false;
  }

  activeMongoUri = LOCAL_MONGO_URI;
  return true;
};

const stopMongoRecoveryLoop = () => {
  if (mongoRecoveryTimer) {
    clearInterval(mongoRecoveryTimer);
    mongoRecoveryTimer = null;
  }
};

const attemptMongoRecovery = async (reason = "unknown") => {
  if (mongoRecoveryInProgress) return;
  if (mongoose.connection.readyState === 1) {
    stopMongoRecoveryLoop();
    return;
  }
  if (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 3) return;

  mongoRecoveryInProgress = true;
  try {
    console.warn(`Mongo recovery attempt started (${reason})...`);

    if (shouldTryAutoStartMongo(activeMongoUri)) {
      await tryAutoStartLocalMongo();
    }

    await mongoose.connect(activeMongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB reconnected");
    await ensureUserIndexes();
    stopMongoRecoveryLoop();
  } catch (recoveryError) {
    const recoveryErrorText = String(recoveryError?.message || "");
    const switchedToLocal = await trySwitchToLocalFallback(recoveryErrorText);

    if (switchedToLocal) {
      try {
        await mongoose.connect(activeMongoUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB reconnected using local fallback");
        await ensureUserIndexes();
        stopMongoRecoveryLoop();
        return;
      } catch (fallbackRecoveryError) {
        console.error("Mongo fallback recovery failed:", fallbackRecoveryError.message);
      }
    }

    console.error("Mongo recovery attempt failed:", recoveryErrorText);
  } finally {
    mongoRecoveryInProgress = false;
  }
};

const startMongoRecoveryLoop = (reason = "disconnected") => {
  if (mongoRecoveryTimer) return;
  console.warn(`Mongo recovery loop started (${reason}).`);
  mongoRecoveryTimer = setInterval(() => {
    attemptMongoRecovery(reason);
  }, MONGO_RECOVERY_INTERVAL_MS);
};

const attachMongoConnectionHandlers = () => {
  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected.");
    startMongoRecoveryLoop("disconnected");
  });

  mongoose.connection.on("connected", () => {
    stopMongoRecoveryLoop();
  });

  mongoose.connection.on("error", (err) => {
    const msg = String(err?.message || "");
    console.error("MongoDB runtime error:", msg);
    if (msg.includes("ECONNREFUSED")) {
      startMongoRecoveryLoop("runtime-conn-refused");
    }
  });
};

const startServer = async () => {
  attachMongoConnectionHandlers();

  try {
    await mongoose.connect(activeMongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected");
    await ensureUserIndexes();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (error) {
    const errorText = String(error?.message || "");
    const isConnRefused = errorText.includes("ECONNREFUSED");

    if (isConnRefused && shouldTryAutoStartMongo(activeMongoUri)) {
      console.warn("MongoDB refused connection. Trying local auto-start...");
      const started = await tryAutoStartLocalMongo();

      if (started) {
        try {
          await mongoose.connect(activeMongoUri, {
            serverSelectionTimeoutMS: 5000,
          });
          console.log("MongoDB connected after auto-start");
          await ensureUserIndexes();

          server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
          });
          return;
        } catch (retryError) {
          console.error("Retry connection after auto-start failed:", retryError.message);
        }
      }
    }

    const switchedToLocal = await trySwitchToLocalFallback(errorText);
    if (switchedToLocal) {
      try {
        await mongoose.connect(activeMongoUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB connected using local fallback");
        await ensureUserIndexes();

        server.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
          console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
        });
        return;
      } catch (fallbackError) {
        console.error("Fallback connection failed:", fallbackError.message);
      }
    }

    console.error("Failed to start server:", error);
    console.error("MongoDB connection could not be established.");
    console.error("Fix steps:");
    console.error("1) Verify MONGO_URI inside alumni-backend/.env.");
    console.error("2) If using Atlas, allow this machine's IP in Atlas Network Access and check DB user credentials.");
    console.error("3) For local setup, use mongodb://127.0.0.1:27017/alumniDB.");
    console.error("4) Optional: set LOCAL_MONGO_URI and AUTO_START_LOCAL_MONGO=true for fallback.");
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
