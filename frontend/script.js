async function loadTasks() {
    const response = await fetch("http://localhost:5001/api/tasks");
    const tasks = await response.json();
    console.log(tasks);
}

// Current date cutoff for overdue tasks (October 23, 2026)
const TODAY = 23;

// Sample tasks (Notice Day 15 & 20 have incomplete tasks before Oct 23 -> Overdue!)
const tasksByDay = {
    "15": [
        { id: 1, text: "Finish INFS3208 Dockerfile", done: true },
        { id: 2, text: "Set up Kubernetes deployment", done: false }
    ],
    "20": [
        { id: 3, text: "Write API endpoints for tasks", done: false }
    ],
    "23": [
        { id: 4, text: "Test microservice containers", done: false }
    ]
};

let currentSelectedDay = null;
let currentFilter = "all"; // "all" | "incomplete" | "completed"

// Helper: Checks if a day has any incomplete tasks before TODAY
function isDayOverdue(dayNumber) {
    const day = Number(dayNumber);
    if (day >= TODAY) return false;
    const tasks = tasksByDay[dayNumber] || [];
    return tasks.some(task => !task.done);
}

// Updates calendar colors (overdue / active) and recalculates the 3 top stats
function updateStatsAndCalendar() {
    const dayElements = document.querySelectorAll('.day:not(.empty)');
    const activeDayNumbers = [];

    dayElements.forEach(el => {
        const dayNum = el.textContent.trim();
        const dayTasks = tasksByDay[dayNum] || [];

        // If a day has tasks and ALL of them are completed, auto-mark day as active (green)
        if (dayTasks.length > 0 && dayTasks.every(t => t.done)) {
            el.classList.add('active');
        }

        // Toggle overdue red styling if day < TODAY and has unchecked tasks
        if (isDayOverdue(dayNum)) {
            el.classList.add('overdue');
        } else {
            el.classList.remove('overdue');
        }

        if (el.classList.contains('active')) {
            activeDayNumbers.push(Number(dayNum));
        }
    });

    // 1. Active Days Count
    const activeDaysEl = document.getElementById('active-days-count');
    if (activeDaysEl) activeDaysEl.textContent = activeDayNumbers.length;

    // 2. Tasks Done Count
    let completedTasksCount = 0;
    Object.values(tasksByDay).forEach(dayTasks => {
        dayTasks.forEach(t => {
            if (t.done) completedTasksCount++;
        });
    });
    const tasksDoneEl = document.getElementById('tasks-done-count');
    if (tasksDoneEl) tasksDoneEl.textContent = completedTasksCount;

    // 3. Calculate Longest Consecutive Streak (or Current Streak)
    activeDayNumbers.sort((a, b) => a - b);
    let currentStreak = 0;
    let maxStreak = 0;

    for (let i = 0; i < activeDayNumbers.length; i++) {
        if (i === 0 || activeDayNumbers[i] === activeDayNumbers[i - 1] + 1) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
        }
    }

    const streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.textContent = maxStreak;
}

// Renders the tasks for the selected day (Bottom-Left Box)
function renderTasks(dayNumber) {
    const taskList = document.getElementById("task-list");
    const selectedDateLabel = document.getElementById("selected-date");

    selectedDateLabel.textContent = `October ${dayNumber}, 2026`;
    taskList.innerHTML = "";

    const dayTasks = tasksByDay[dayNumber] || [];

    if (dayTasks.length === 0) {
        taskList.innerHTML = `<li class="task-item" style="color: #8c8c8c; justify-content: center;">No tasks for this day yet</li>`;
        return;
    }

    dayTasks.forEach((task) => {
        const isOverdue = !task.done && Number(dayNumber) < TODAY;
        const list_item_html = `
            <li class="task-item" data-id="${task.id}">
                <label class="task-label">
                    <input type="checkbox" class="task-checkbox" ${task.done ? "checked" : ""}>
                    <span class="task-text">${task.text}</span>
                    ${isOverdue ? '<span class="task-date-badge overdue" style="margin-left:auto;">Overdue</span>' : ''}
                </label>
                <button class="delete-task-btn">✕</button>
            </li>`;
        taskList.insertAdjacentHTML("beforeend", list_item_html);
    });
}

// Renders all tasks across the month with active filter (Right Sidebar)
function renderAllTasks() {
    const allTasksList = document.getElementById("all-tasks-list");
    const totalTasksCount = document.getElementById("total-tasks-count");
    if (!allTasksList) return;

    allTasksList.innerHTML = "";

    const sortedDays = Object.keys(tasksByDay).sort((a, b) => Number(a) - Number(b));
    let shownCount = 0;

    sortedDays.forEach((day) => {
        tasksByDay[day].forEach((task) => {
            if (currentFilter === "incomplete" && task.done) return;
            if (currentFilter === "completed" && !task.done) return;

            shownCount++;
            const isOverdue = !task.done && Number(day) < TODAY;
            const badgeClass = isOverdue ? "task-date-badge overdue" : "task-date-badge";
            const badgeText = isOverdue ? `Oct ${day} • Overdue` : `Oct ${day}`;

            const itemHTML = `
                <li class="task-item" data-day="${day}" title="Click to jump to October ${day}">
                    <div class="all-task-info">
                        <span class="${badgeClass}">${badgeText}</span>
                        <span class="task-text ${task.done ? 'task-done-text' : ''}">${task.text}</span>
                    </div>
                </li>`;
            allTasksList.insertAdjacentHTML("beforeend", itemHTML);
        });
    });

    if (totalTasksCount) {
        totalTasksCount.textContent = `${shownCount} ${shownCount === 1 ? 'task' : 'tasks'}`;
    }

    if (shownCount === 0) {
        allTasksList.innerHTML = `<li class="task-item" style="color: #8c8c8c; justify-content: center; cursor: default;">No ${currentFilter !== 'all' ? currentFilter : ''} tasks found</li>`;
    }
}

function refreshUI() {
    if (currentSelectedDay) renderTasks(currentSelectedDay);
    renderAllTasks();
    updateStatsAndCalendar();
}

function selectCalendarDay(dayNumber) {
    currentSelectedDay = String(dayNumber);

    document.querySelectorAll('.day:not(.empty)').forEach(el => {
        if (el.textContent.trim() === currentSelectedDay) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });

    renderTasks(currentSelectedDay);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ script.js is connected and running!");

    const calendar = document.getElementById('calendar');
    const taskList = document.getElementById('task-list');
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const filterContainer = document.getElementById('task-filters');
    const allTasksList = document.getElementById('all-tasks-list');

    // Initial render
    refreshUI();

    // 1. SINGLE-CLICK DAY ON CALENDAR -> Select day to view tasks
    calendar.addEventListener('click', (event) => {
        const clickedDay = event.target.closest('.day:not(.empty)');
        if (!clickedDay) return;

        selectCalendarDay(clickedDay.textContent.trim());
    });

    // 2. DOUBLE-CLICK DAY ON CALENDAR -> Toggle "Logged in" (green) manually
    calendar.addEventListener('dblclick', (event) => {
        const clickedDay = event.target.closest('.day:not(.empty)');
        if (!clickedDay) return;

        clickedDay.classList.toggle('active');
        updateStatsAndCalendar();
    });

    // 3. ADD NEW TASK
    function handleAddTask() {
        if (!currentSelectedDay) {
            alert("Please click a day on the calendar first!");
            return;
        }
        const text = newTaskInput.value.trim();
        if (!text) return;

        if (!tasksByDay[currentSelectedDay]) {
            tasksByDay[currentSelectedDay] = [];
        }

        tasksByDay[currentSelectedDay].push({
            id: Date.now(),
            text: text,
            done: false
        });

        newTaskInput.value = "";
        refreshUI();
    }

    addTaskBtn.addEventListener('click', handleAddTask);
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });

    // 4. DELETE OR CHECK OFF A TASK
    taskList.addEventListener('click', (event) => {
        const taskItem = event.target.closest('.task-item');
        if (!taskItem || !currentSelectedDay) return;

        const taskId = Number(taskItem.dataset.id);

        if (event.target.classList.contains('delete-task-btn')) {
            tasksByDay[currentSelectedDay] = tasksByDay[currentSelectedDay].filter(t => t.id !== taskId);
            refreshUI();
        }

        if (event.target.classList.contains('task-checkbox')) {
            const task = tasksByDay[currentSelectedDay].find(t => t.id === taskId);
            if (task) task.done = event.target.checked;
            refreshUI();
        }
    });

    // 5. FILTER BUTTONS
    if (filterContainer) {
        filterContainer.addEventListener('click', (event) => {
            const btn = event.target.closest('.filter-btn');
            if (!btn) return;

            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentFilter = btn.dataset.filter;
            renderAllTasks();
        });
    }

    // 6. CLICK SIDEBAR ITEM TO JUMP TO DAY
    if (allTasksList) {
        allTasksList.addEventListener('click', (event) => {
            const item = event.target.closest('.task-item[data-day]');
            if (!item) return;

            selectCalendarDay(item.dataset.day);
        });
    }
});