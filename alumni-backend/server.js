const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");  // <-- add this
const userRoutes = require("./routes/userRoutes"); // <-- add this
const alumniRoutes = require("./routes/alumniRoutes");
const eventRoutes = require("./routes/eventRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);  // <-- mount admin routes
app.use("/api/auth", userRoutes); // <-- mount user routes
app.use("/api/user", userRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/events", eventRoutes);


// DB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
