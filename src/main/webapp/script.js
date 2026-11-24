/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/JavaScript.js to edit this template
 */

"use strict";

const $ = id => document.getElementById(id);
const STORAGE_KEY = "taskflow_tasks";

let tasks = loadTasks();
let selectedView = "all";

/* -------------------- Storage -------------------- */

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    return [];
  }

  try {
    return JSON.parse(savedTasks);
  } catch (error) {
    console.error("Invalid saved task data:", error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/* -------------------- Utility functions -------------------- */

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getToday() {
  return formatDate(new Date());
}

function getDateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function formatDeadline(deadline) {
  if (!deadline) {
    return "No deadline";
  }

  const date = new Date(deadline + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short"
  });
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  window.setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2400);
}

/* -------------------- Rendering -------------------- */

function render() {
  renderCounts();
  renderProgress();
  renderTasks();
  renderDeadlines();
  updateGreeting();
  updateDate();
}

function renderCounts() {
  const completed = tasks.filter(task =>
    task.status === "Completed"
  ).length;

  const inProgress = tasks.filter(task =>
    task.status === "In Progress"
  ).length;

  const overdue = tasks.filter(task =>
    task.deadline &&
    task.deadline < getToday() &&
    task.status !== "Completed"
  ).length;

  $("totalCount").textContent = tasks.length;
  $("progressCount").textContent = inProgress;
  $("completedCount").textContent = completed;
  $("overdueCount").textContent = overdue;
}

function renderProgress() {
  const total = tasks.length;

  function getPercentage(count) {
    if (total === 0) {
      return 0;
    }

    return Math.round((count / total) * 100);
  }

  const completed = tasks.filter(task =>
    task.status === "Completed"
  ).length;

  const inProgress = tasks.filter(task =>
    task.status === "In Progress"
  ).length;

  const pending = tasks.filter(task =>
    task.status === "Pending"
  ).length;

  const completionPercentage = getPercentage(completed);
  const progressPercentage = getPercentage(inProgress);
  const pendingPercentage = getPercentage(pending);

  $("completionText").textContent = completionPercentage + "%";
  $("completionBar").style.width = completionPercentage + "%";

  $("inProgressText").textContent = progressPercentage + "%";
  $("inProgressBar").style.width = progressPercentage + "%";

  $("pendingText").textContent = pendingPercentage + "%";
  $("pendingBar").style.width = pendingPercentage + "%";
}

function getFilteredTasks() {
  const search = $("searchInput").value.toLowerCase().trim();
  const status = $("statusFilter").value;
  const priority = $("priorityFilter").value;

  let visibleTasks = tasks.filter(task => {
    const text = (
      task.title + " " +
      (task.description || "")
    ).toLowerCase();

    const matchesSearch = !search || text.includes(search);
    const matchesStatus = !status || task.status === status;
    const matchesPriority = !priority || task.priority === priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (selectedView === "today") {
    visibleTasks = visibleTasks.filter(task =>
      task.deadline === getToday() &&
      task.status !== "Completed"
    );
  }

  if (selectedView === "completed") {
    visibleTasks = visibleTasks.filter(task =>
      task.status === "Completed"
    );
  }

  if (selectedView === "high") {
    visibleTasks = visibleTasks.filter(task =>
      task.priority === "High"
    );
  }

  return visibleTasks;
}

function renderTasks() {
  const visibleTasks = getFilteredTasks();

  const headings = {
    all: "My tasks",
    today: "Due today",
    completed: "Completed tasks",
    high: "High-priority tasks"
  };

  $("listHeading").textContent = headings[selectedView];

  if (visibleTasks.length === 0) {
    $("taskList").innerHTML =
      '<div class="empty">No tasks match the current filters.</div>';
    return;
  }

  $("taskList").innerHTML = visibleTasks
    .map(task => createTaskCard(task))
    .join("");
}

function createTaskCard(task) {
  const isCompleted = task.status === "Completed";
  const priorityClass = task.priority.toLowerCase();

  return `
    <article class="task ${isCompleted ? "done" : ""}">
      <input
        type="checkbox"
        aria-label="Mark ${escapeHtml(task.title)} completed"
        data-action="toggle"
        data-id="${task.id}"
        ${isCompleted ? "checked" : ""}
      >

      <div>
        <h3>${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.description || "No description added.")}</p>

        <div class="task-meta">
          <span class="pill priority-${priorityClass}">
            ${task.priority} priority
          </span>

          <span class="pill">
            ◷ ${escapeHtml(formatDeadline(task.deadline))}
          </span>
        </div>
      </div>

      <div>
        <span class="status">${escapeHtml(task.status)}</span>

        <div class="task-actions" style="margin-top: 8px">
          <button
            type="button"
            class="icon-btn"
            title="Edit task"
            aria-label="Edit ${escapeHtml(task.title)}"
            data-action="edit"
            data-id="${task.id}"
          >✎</button>

          <button
            type="button"
            class="icon-btn"
            title="Delete task"
            aria-label="Delete ${escapeHtml(task.title)}"
            data-action="delete"
            data-id="${task.id}"
          >×</button>
        </div>
      </div>
    </article>
  `;
}

function renderDeadlines() {
  const upcomingTasks = tasks
    .filter(task =>
      task.status !== "Completed" &&
      task.deadline
    )
    .sort((first, second) =>
      first.deadline.localeCompare(second.deadline)
    )
    .slice(0, 4);

  if (upcomingTasks.length === 0) {
    $("deadlineList").innerHTML =
      '<div class="empty">No upcoming deadlines.</div>';
    return;
  }

  $("deadlineList").innerHTML = upcomingTasks.map(task => {
    const date = new Date(task.deadline + "T00:00:00");

    let deadlineLabel = "Due " + formatDeadline(task.deadline);

    if (task.deadline < getToday()) {
      deadlineLabel = "Overdue";
    } else if (task.deadline === getToday()) {
      deadlineLabel = "Due today";
    }

    const month = date
      .toLocaleDateString(undefined, { month: "short" })
      .toUpperCase();

    return `
      <div class="deadline">
        <div class="daybox">
          ${month}
          <b>${date.getDate()}</b>
        </div>

        <div>
          <strong>${escapeHtml(task.title)}</strong>
          <small>
            ${deadlineLabel} · ${task.priority} priority
          </small>
        </div>
      </div>
    `;
  }).join("");
}

/* -------------------- Create and update -------------------- */

function openCreateModal() {
  $("taskForm").reset();
  $("editId").value = "";
  $("modalTitle").textContent = "Create a task";
  $("taskModal").classList.add("show");
  $("taskTitle").focus();
}

function openEditModal(task) {
  $("editId").value = task.id;
  $("taskTitle").value = task.title;
  $("taskDescription").value = task.description || "";
  $("taskPriority").value = task.priority;
  $("taskStatus").value = task.status;
  $("taskDeadline").value = task.deadline || "";
  $("modalTitle").textContent = "Edit task";
  $("taskModal").classList.add("show");
  $("taskTitle").focus();
}

function closeModal() {
  $("taskModal").classList.remove("show");
}

$("taskForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("editId").value;

  const taskData = {
    title: $("taskTitle").value.trim(),
    description: $("taskDescription").value.trim(),
    priority: $("taskPriority").value,
    status: $("taskStatus").value,
    deadline: $("taskDeadline").value
  };

  if (!taskData.title) {
    showToast("Task title is required");
    $("taskTitle").focus();
    return;
  }

  if (id) {
    tasks = tasks.map(task =>
      task.id == id
        ? { ...task, ...taskData }
        : task
    );

    showToast("Task updated");
  } else {
    tasks.unshift({
      id: Date.now(),
      ...taskData,
      createdAt: new Date().toISOString()
    });

    showToast("Task created");
  }

  saveTasks();
  closeModal();
  render();
});

$("newTaskBtn").addEventListener("click", openCreateModal);
$("cancelModal").addEventListener("click", closeModal);

$("taskModal").addEventListener("click", event => {
  if (event.target === $("taskModal")) {
    closeModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
  }
});

/* -------------------- Toggle and delete -------------------- */

$("taskList").addEventListener("change", event => {
  const checkbox = event.target.closest('[data-action="toggle"]');

  if (!checkbox) {
    return;
  }

  const task = tasks.find(item =>
    item.id == checkbox.dataset.id
  );

  if (!task) {
    return;
  }

  task.status = checkbox.checked
    ? "Completed"
    : "Pending";

  saveTasks();
  render();

  showToast(
    checkbox.checked
      ? "Task marked completed"
      : "Task moved to pending"
  );
});

$("taskList").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const task = tasks.find(item =>
    item.id == button.dataset.id
  );

  if (!task) {
    return;
  }

  if (button.dataset.action === "edit") {
    openEditModal(task);
  }

  if (button.dataset.action === "delete") {
    const confirmed = confirm(
      `Delete "${task.title}"?`
    );

    if (confirmed) {
      tasks = tasks.filter(item =>
        item.id != button.dataset.id
      );

      saveTasks();
      render();
      showToast("Task deleted");
    }
  }
});

/* -------------------- Search and filters -------------------- */

["searchInput", "statusFilter", "priorityFilter"].forEach(id => {
  const eventName =
    id === "searchInput"
      ? "input"
      : "change";

  $(id).addEventListener(eventName, render);
});

$("clearFilters").addEventListener("click", () => {
  $("searchInput").value = "";
  $("statusFilter").value = "";
  $("priorityFilter").value = "";
  selectedView = "all";

  document
    .querySelectorAll(".nav button[data-view]")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.view === "all"
      );
    });

  render();
});

document
  .querySelectorAll(".nav button[data-view]")
  .forEach(button => {
    button.addEventListener("click", () => {
      selectedView = button.dataset.view;

      document
        .querySelectorAll(".nav button[data-view]")
        .forEach(item => {
          item.classList.toggle(
            "active",
            item === button
          );
        });

      render();
    });
  });

/* -------------------- AI assistant -------------------- */
const API_URL =
  "https://nl6ks1h9a2.execute-api.ap-south-1.amazonaws.com/dev/api-resource";

$("suggestBtn").addEventListener("click", async () => {
  const taskText = $("aiTask").value.trim();
  const output = $("aiOutput");
  const suggestButton = $("suggestBtn");

  if (!taskText) {
    showToast("Enter a task first");
    $("aiTask").focus();
    return;
  }

  suggestButton.disabled = true;
  suggestButton.textContent = "Generating...";
  output.textContent = "Generating AI suggestions...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        task: taskText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate suggestions");
    }

    const suggestions = data.subtasks;

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error("No subtasks were returned");
    }

    output.innerHTML = "";

    const list = document.createElement("ol");
    list.className = "ai-results";

    suggestions.forEach(suggestion => {
      const item = document.createElement("li");
      item.textContent = suggestion;
      list.appendChild(item);
    });

    output.appendChild(list);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "secondary";
    addButton.style.marginTop = "10px";
    addButton.textContent = "＋ Add suggestions as tasks";

    output.appendChild(addButton);

    addButton.addEventListener("click", () => {
      suggestions.forEach((suggestion, index) => {
        tasks.unshift({
          id: Date.now() + index,
          title: suggestion,
          description: "AI-generated subtask for: " + taskText,
          priority: "Medium",
          status: "Pending",
          deadline: getDateAfter(index + 1),
          createdAt: new Date().toISOString()
        });
      });

      saveTasks();
      render();
      showToast("AI suggestions added as tasks");
      output.innerHTML = "";
    });

  } catch (error) {
    console.error("AI assistant error:", error);
    output.textContent = "Error: " + error.message;
  } finally {
    suggestButton.disabled = false;
    suggestButton.textContent = "✦ Suggest subtasks";
  }
});

/* -------------------- Header information -------------------- */

function updateGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    $("greeting").textContent = "Good morning! 👋";
  } else if (hour < 17) {
    $("greeting").textContent = "Good afternoon! 👋";
  } else {
    $("greeting").textContent = "Good evening! 👋";
  }
}

function updateDate() {
  $("todayDate").textContent = new Date().toLocaleDateString(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );
}

/* -------------------- Start the application -------------------- */

render();

