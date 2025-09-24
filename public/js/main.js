// DOM Elements
const addTaskBtn = document.getElementById("add-task-btn");
const taskModal = document.getElementById("task-modal");
const closeModal = document.getElementById("close-modal");
const cancelBtn = document.getElementById("cancel-btn");
const taskForm = document.getElementById("task-form");
const modalTitle = document.getElementById("modal-title");
const submitText = document.getElementById("submit-text");

// State
let currentTaskId = null;
let isEditMode = false;

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  // Modal event listeners
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", openAddTaskModal);
  }

  if (closeModal) {
    closeModal.addEventListener("click", closeTaskModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeTaskModal);
  }

  if (taskForm) {
    taskForm.addEventListener("submit", handleTaskSubmit);
  }

  // Close modal when clicking outside
  if (taskModal) {
    taskModal.addEventListener("click", function (e) {
      if (e.target === taskModal) {
        closeTaskModal();
      }
    });
  }

  // Task action listeners
  document.addEventListener("click", function (e) {
    if (e.target.closest(".edit-btn")) {
      const taskId = e.target.closest(".edit-btn").dataset.taskId;
      openEditTaskModal(taskId);
    }

    if (e.target.closest(".delete-btn")) {
      const taskId = e.target.closest(".delete-btn").dataset.taskId;
      deleteTask(taskId);
    }
  });

  // Filter listeners
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterTasks(this.dataset.status);

      // Update active filter
      filterBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
    });
  });
}

// Modal Functions
function openAddTaskModal() {
  isEditMode = false;
  currentTaskId = null;
  modalTitle.textContent = "Add New Task";
  submitText.textContent = "Create Task";
  taskForm.reset();
  taskModal.classList.add("show");
}

function openEditTaskModal(taskId) {
  isEditMode = true;
  currentTaskId = taskId;
  modalTitle.textContent = "Edit Task";
  submitText.textContent = "Update Task";

  // Get task data from the DOM
  const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskCard) {
    const title = taskCard.querySelector(".task-header h3").textContent;
    const description =
      taskCard.querySelector(".task-description")?.textContent || "";
    const status = taskCard.dataset.status;
    const priority = taskCard
      .querySelector(".priority-badge")
      .textContent.toLowerCase()
      .trim();

    // Fill form with current data
    document.getElementById("task-title").value = title;
    document.getElementById("task-description").value = description;
    document.getElementById("task-status").value = status;
    document.getElementById("task-priority").value = priority;

    // Handle due date if exists
    const dueDateElement = taskCard.querySelector(".task-due-date");
    if (dueDateElement) {
      const dueDateText = dueDateElement.textContent.replace("Due: ", "");
      const dueDate = new Date(dueDateText);
      if (!isNaN(dueDate.getTime())) {
        document.getElementById("task-due-date").value = dueDate
          .toISOString()
          .split("T")[0];
      }
    }
  }

  taskModal.classList.add("show");
}

function closeTaskModal() {
  taskModal.classList.remove("show");
  taskForm.reset();
  currentTaskId = null;
  isEditMode = false;
}

// Task CRUD Functions
async function handleTaskSubmit(e) {
  e.preventDefault();

  const formData = new FormData(taskForm);
  const taskData = {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate") || null,
  };

  const submitButton = taskForm.querySelector('button[type="submit"]');
  submitButton.classList.add("loading");

  try {
    let response;
    if (isEditMode && currentTaskId) {
      response = await fetch(`/api/tasks/${currentTaskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });
    } else {
      response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });
    }

    const result = await response.json();

    if (result.success) {
      closeTaskModal();
      showSuccessMessage(
        isEditMode ? "Task updated successfully!" : "Task created successfully!"
      );
      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      showErrorMessage(result.message || "An error occurred");
    }
  } catch (error) {
    console.error("Task submit error:", error);
    showErrorMessage("Network error. Please try again.");
  } finally {
    submitButton.classList.remove("loading");
  }
}

async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskCard) {
    taskCard.style.opacity = "0.6";
    taskCard.style.pointerEvents = "none";
  }

  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      showSuccessMessage("Task deleted successfully!");
      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      showErrorMessage(result.message || "Failed to delete task");
      // Restore task card
      if (taskCard) {
        taskCard.style.opacity = "1";
        taskCard.style.pointerEvents = "auto";
      }
    }
  } catch (error) {
    console.error("Delete task error:", error);
    showErrorMessage("Network error. Please try again.");
    // Restore task card
    if (taskCard) {
      taskCard.style.opacity = "1";
      taskCard.style.pointerEvents = "auto";
    }
  }
}

// Filter Functions
function filterTasks(status) {
  const taskCards = document.querySelectorAll(".task-card");

  taskCards.forEach((card) => {
    if (status === "all" || card.dataset.status === status) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Utility Functions
function showSuccessMessage(message) {
  const existingMessage = document.querySelector(".success-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageElement = document.createElement("div");
  messageElement.className = "success-message";
  messageElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

  const container = document.querySelector(".container");
  container.insertBefore(messageElement, container.firstChild);

  setTimeout(() => {
    messageElement.remove();
  }, 5000);
}

function showErrorMessage(message) {
  const existingMessage = document.querySelector(".error-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageElement = document.createElement("div");
  messageElement.className = "error-message";
  messageElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

  const container = document.querySelector(".container");
  container.insertBefore(messageElement, container.firstChild);

  setTimeout(() => {
    messageElement.remove();
  }, 5000);
}

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // ESC to close modal
  if (e.key === "Escape" && taskModal.classList.contains("show")) {
    closeTaskModal();
  }

  // Ctrl/Cmd + N to add new task
  if (
    (e.ctrlKey || e.metaKey) &&
    e.key === "n" &&
    !taskModal.classList.contains("show")
  ) {
    e.preventDefault();
    openAddTaskModal();
  }
});

// Auto-save form data to prevent loss
let autoSaveTimeout;
if (taskForm) {
  const formInputs = taskForm.querySelectorAll("input, textarea, select");
  formInputs.forEach((input) => {
    input.addEventListener("input", function () {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        saveFormData();
      }, 1000);
    });
  });
}

function saveFormData() {
  if (!taskForm || !taskModal.classList.contains("show")) return;

  const formData = new FormData(taskForm);
  const data = {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
  };

  localStorage.setItem("taskFormData", JSON.stringify(data));
}

function restoreFormData() {
  const savedData = localStorage.getItem("taskFormData");
  if (savedData && !isEditMode) {
    try {
      const data = JSON.parse(savedData);
      document.getElementById("task-title").value = data.title || "";
      document.getElementById("task-description").value =
        data.description || "";
      document.getElementById("task-status").value = data.status || "pending";
      document.getElementById("task-priority").value =
        data.priority || "medium";
      document.getElementById("task-due-date").value = data.dueDate || "";
    } catch (error) {
      console.error("Error restoring form data:", error);
      localStorage.removeItem("taskFormData");
    }
  }
}

function clearSavedFormData() {
  localStorage.removeItem("taskFormData");
}

// Clear saved form data when task is successfully created
const originalCloseTaskModal = closeTaskModal;
closeTaskModal = function () {
  clearSavedFormData();
  originalCloseTaskModal();
};
