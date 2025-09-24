const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
router.post(
  "/signup",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render("auth/signup", {
          title: "Sign Up",
          errors: errors.array(),
          formData: req.body,
        });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).render("auth/signup", {
          title: "Sign Up",
          errors: [{ msg: "User already exists with this email" }],
          formData: req.body,
        });
      }

      // Create new user
      const user = new User({ name, email, password });
      await user.save();

      // Generate token and set cookie
      const token = generateToken(user._id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.redirect("/dashboard");
    } catch (error) {
      console.error("Signup error:", error.message);
      res.status(500).render("auth/signup", {
        title: "Sign Up",
        errors: [{ msg: "Server error. Please try again." }],
        formData: req.body,
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render("auth/login", {
          title: "Login",
          errors: errors.array(),
          formData: req.body,
        });
      }

      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).render("auth/login", {
          title: "Login",
          errors: [{ msg: "Invalid credentials" }],
          formData: req.body,
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).render("auth/login", {
          title: "Login",
          errors: [{ msg: "Invalid credentials" }],
          formData: req.body,
        });
      }

      // Generate token and set cookie
      const token = generateToken(user._id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.redirect("/dashboard");
    } catch (error) {
      console.error("Login error:", error.message);
      res.status(500).render("auth/login", {
        title: "Login",
        errors: [{ msg: "Server error. Please try again." }],
        formData: req.body,
      });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

module.exports = router;
