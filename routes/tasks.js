const express = require("express");
const { body, validationResult } = require("express-validator");
const Task = require("../models/Task");
const auth = require("../middleware/auth");
const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   POST /api/tasks
// @desc    Create a task
// @access  Private
router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("status").optional().isIn(["pending", "in-progress", "completed"]),
    body("priority").optional().isIn(["low", "medium", "high"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { title, description, status, priority, dueDate } = req.body;

      const task = new Task({
        title,
        description,
        status: status || "pending",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.user._id,
      });

      await task.save();
      res.json({ success: true, task });
    } catch (error) {
      console.error("Create task error:", error.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// @route   GET /api/tasks
// @desc    Get all tasks for user
// @access  Private
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, tasks });
  } catch (error) {
    console.error("Get tasks error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  "/:id",
  [
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("status").optional().isIn(["pending", "in-progress", "completed"]),
    body("priority").optional().isIn(["low", "medium", "high"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { title, description, status, priority, dueDate } = req.body;

      const task = await Task.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });
      if (!task) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });
      }

      // Update fields
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined)
        task.dueDate = dueDate ? new Date(dueDate) : null;

      await task.save();
      res.json({ success: true, task });
    } catch (error) {
      console.error("Update task error:", error.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
