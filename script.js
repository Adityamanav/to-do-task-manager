/**
 * TaskFlow — Modern To-Do Manager
 * Created By Adityacse2027
 */

(() => {
  // ===== State =====
  let tasks = JSON.parse(localStorage.getItem("taskflow-tasks")) || [];
  let currentFilter = "all";

  // ===== DOM =====
  const taskInput = document.getElementById("taskInput");
  const addForm = document.getElementById("addForm");
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const clearCompletedBtn = document.getElementById("clearCompleted");
  const themeToggle = document.getElementById("themeToggle");
  const filterBtns = document.querySelectorAll(".filter-btn");

  const totalEl = document.getElementById("totalTasks");
  const activeEl = document.getElementById("activeTasks");
  const completedEl = document.getElementById("completedTasks");

  // ===== Theme =====
  const savedTheme = localStorage.getItem("taskflow-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("taskflow-theme", next);
  });

  // ===== Persistence =====
  function save() {
    localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
  }

  // ===== Stats =====
  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;

    totalEl.textContent = total;
    activeEl.textContent = active;
    completedEl.textContent = completed;

    clearCompletedBtn.hidden = completed === 0;
  }

  // ===== Render =====
  function getFilteredTasks() {
    if (currentFilter === "active") return tasks.filter((t) => !t.completed);
    if (currentFilter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }

  function render() {
    const filtered = getFilteredTasks();
    taskList.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.hidden = false;
      emptyState.querySelector("p").textContent =
        currentFilter === "all"
          ? "No tasks yet. Add one above!"
          : currentFilter === "active"
          ? "No active tasks 🎉"
          : "No completed tasks yet";
    } else {
      emptyState.hidden = true;
    }

    filtered.forEach((task, index) => {
      const li = document.createElement("li");
      li.className = `task-item${task.completed ? " completed" : ""}`;
      li.dataset.id = task.id;
      li.style.animationDelay = `${index * 0.04}s`;

      li.innerHTML = `
        <button class="checkbox" aria-label="Toggle complete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="delete-btn" aria-label="Delete task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      // Toggle complete
      li.querySelector(".checkbox").addEventListener("click", () => {
        toggleTask(task.id);
      });

      // Delete
      li.querySelector(".delete-btn").addEventListener("click", () => {
        deleteTask(task.id, li);
      });

      // Edit on double-click
      const textEl = li.querySelector(".task-text");
      textEl.addEventListener("dblclick", () => {
        textEl.contentEditable = "true";
        textEl.focus();

        // Select all text
        const range = document.createRange();
        range.selectNodeContents(textEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });

      textEl.addEventListener("blur", () => {
        textEl.contentEditable = "false";
        const newText = textEl.textContent.trim();
        if (newText && newText !== task.text) {
          updateTaskText(task.id, newText);
        } else {
          textEl.textContent = task.text;
        }
      });

      textEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          textEl.blur();
        }
        if (e.key === "Escape") {
          textEl.textContent = task.text;
          textEl.blur();
        }
      });

      taskList.appendChild(li);
    });

    updateStats();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Actions =====
  function addTask(text) {
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    tasks.unshift(task);
    save();
    render();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      save();
      render();
    }
  }

  function deleteTask(id, element) {
    element.classList.add("removing");
    element.addEventListener("animationend", () => {
      tasks = tasks.filter((t) => t.id !== id);
      save();
      render();
    });
  }

  function updateTaskText(id, text) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.text = text;
      save();
      render();
    }
  }

  function clearCompleted() {
    const completedItems = taskList.querySelectorAll(".task-item.completed");
    if (completedItems.length === 0) return;

    completedItems.forEach((el, i) => {
      el.style.animationDelay = `${i * 0.05}s`;
      el.classList.add("removing");
    });

    // Wait for last animation
    setTimeout(() => {
      tasks = tasks.filter((t) => !t.completed);
      save();
      render();
    }, 300 + completedItems.length * 50);
  }

  // ===== Event Listeners =====
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    addTask(text);
    taskInput.value = "";
    taskInput.focus();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  clearCompletedBtn.addEventListener("click", clearCompleted);

  // Keyboard shortcut: focus input with /
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== taskInput) {
      e.preventDefault();
      taskInput.focus();
    }
  });

  // ===== Init =====
  render();
  taskInput.focus();
})();