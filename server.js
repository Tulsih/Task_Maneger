const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./confing/db");
require("dotenv").config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));

// Root route
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Auth routes (for rendering views)
app.get("/login", (req, res) => {
  res.render("auth/login", { title: "Login" });
});

app.get("/signup", (req, res) => {
  res.render("auth/signup", { title: "Sign Up" });
});

app.get("/dashboard", require("./middleware/auth"), async (req, res) => {
  const Task = require("./models/Task");
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.render("tasks/dashboard", {
      title: "Dashboard",
      user: req.user,
      tasks: tasks,
    });
  } catch (error) {
    res.status(500).render("tasks/dashboard", {
      title: "Dashboard",
      user: req.user,
      tasks: [],
      error: "Error loading tasks",
    });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
