// Data Structure
let tasks = [];
let categories = [
    { id: 'general', name: 'General', color: '#3498db' },
    { id: 'trabajo', name: 'Trabajo', color: '#9b59b6' },
    { id: 'personal', name: 'Personal', color: '#1abc9c' },
    { id: 'urgente', name: 'Urgente', color: '#e74c3c' }
];
let currentFilter = 'all';
let editingTaskId = null;

// Load data on startup
window.onload = function() {
    loadData();
    updateCategoryFilters();
    updateCategorySelect();
    renderAllTasks();
    updateStats();
};

// LocalStorage Functions
function loadData() {
    const savedTasks = localStorage.getItem('kanbanTasks');
    const savedCategories = localStorage.getItem('kanbanCategories');
    
    if (savedTasks) tasks = JSON.parse(savedTasks);
    if (savedCategories) categories = JSON.parse(savedCategories);
}

function saveData() {
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
    localStorage.setItem('kanbanCategories', JSON.stringify(categories));
}

// Category Management
function addCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const color = document.getElementById('newCategoryColor').value;

    if (!name) {
        alert('Ingresa un nombre para la categoría');
        return;
    }

    const id = name.toLowerCase().replace(/\s+/g, '-');
    
    if (categories.find(c => c.id === id)) {
        alert('Ya existe una categoría con ese nombre');
        return;
    }

    categories.push({ id, name, color });
    saveData();
    updateCategoryFilters();
    updateCategorySelect();
    renderCategoriesList();

    document.getElementById('newCategoryName').value = '';
}

function deleteCategory(id) {
    if (confirm('¿Eliminar esta categoría? Las tareas con esta categoría quedarán sin categoría.')) {
        categories = categories.filter(c => c.id !== id);
        tasks.forEach(task => {
            if (task.category === id) task.category = 'general';
        });
        saveData();
        updateCategoryFilters();
        updateCategorySelect();
        renderCategoriesList();
        renderAllTasks();
    }
}

function renderCategoriesList() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = categories.map(cat => `
        <div class="category-item">
            <div class="category-color" style="background: ${cat.color};"></div>
            <span>${cat.name}</span>
            ${categories.length > 1 ? `<button class="category-delete" onclick="deleteCategory('${cat.id}')">✕</button>` : ''}
        </div>
    `).join('');
}

function updateCategoryFilters() {
    const filtersContainer = document.getElementById('filters');
    const categoryButtons = categories.map(cat => 
        `<button class="filter-btn" onclick="setFilter('${cat.id}')" style="border-color: ${cat.color};">
            <span style="color: ${cat.color};">●</span> ${cat.name}
        </button>`
    ).join('');

    filtersContainer.innerHTML = `
        <button class="filter-btn active" onclick="setFilter('all')">Todos</button>
        <button class="filter-btn" onclick="setFilter('baja')">🟢 Baja</button>
        <button class="filter-btn" onclick="setFilter('media')">🟡 Media</button>
        <button class="filter-btn" onclick="setFilter('alta')">🔴 Alta</button>
        ${categoryButtons}
    `;
}

function updateCategorySelect() {
    const select = document.getElementById('taskCategory');
    select.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
}

// Filter Functions
function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderAllTasks();
}

function shouldShowTask(task) {
    if (currentFilter === 'all') return true;
    return task.priority === currentFilter || task.category === currentFilter;
}

// Task CRUD Operations
function openTaskModal(taskId = null) {
    editingTaskId = taskId;
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTitle');

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        modalTitle.textContent = 'Editar Tarea';
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskDueDate').value = task.dueDate;
        document.getElementById('taskStatus').value = task.status;
    } else {
        modalTitle.textContent = 'Nueva Tarea';
        document.getElementById('taskId').value = '';
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = 'media';
        document.getElementById('taskCategory').value = 'general';
        document.getElementById('taskDueDate').value = '';
        document.getElementById('taskStatus').value = 'todo';
    }

    modal.classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
    editingTaskId = null;
}

function saveTask(event) {
    event.preventDefault();

    const taskData = {
        id: editingTaskId || Date.now(),
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value,
        dueDate: document.getElementById('taskDueDate').value,
        status: document.getElementById('taskStatus').value,
        createdAt: editingTaskId ? tasks.find(t => t.id === editingTaskId).createdAt : new Date().toISOString()
    };

    if (editingTaskId) {
        const index = tasks.findIndex(t => t.id === editingTaskId);
        tasks[index] = taskData;
    } else {
        tasks.push(taskData);
    }

    saveData();
    renderAllTasks();
    updateStats();
    closeTaskModal();
}

function deleteTask(id) {
    if (confirm('¿Eliminar esta tarea?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveData();
        renderAllTasks();
        updateStats();
    }
}

// Render Functions
function renderAllTasks() {
    ['todo', 'inProgress', 'done'].forEach(status => {
        renderTasks(status);
    });
}

function renderTasks(status) {
    const container = document.getElementById(`tasks-${status}`);
    const filteredTasks = tasks.filter(t => t.status === status && shouldShowTask(t));
    
    document.getElementById(`count-${status}`).textContent = filteredTasks.length;

    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div>No hay tareas aquí</div>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');
}

function createTaskCard(task) {
    const priorityColors = {
        baja: { bg: 'rgba(46, 204, 113, 0.2)', text: '#2ecc71', icon: '🟢' },
        media: { bg: 'rgba(241, 196, 15, 0.2)', text: '#f1c40f', icon: '🟡' },
        alta: { bg: 'rgba(231, 76, 60, 0.2)', text: '#e74c3c', icon: '🔴' }
    };

    const category = categories.find(c => c.id === task.category) || categories[0];
    const priority = priorityColors[task.priority];

    return `
        <div class="task-card" draggable="true" ondragstart="drag(event)" data-id="${task.id}">
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-actions">
                    <button class="icon-btn" onclick="openTaskModal(${task.id})" title="Editar">✏️</button>
                    <button class="icon-btn" onclick="deleteTask(${task.id})" title="Eliminar">🗑️</button>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-tags">
                <span class="tag" style="background: ${priority.bg}; color: ${priority.text};">
                    ${priority.icon} ${task.priority}
                </span>
                <span class="tag" style="background: ${hexToRgba(category.color, 0.2)}; color: ${category.color}; border: 1px solid ${category.color};">
                    🏷️ ${category.name}
                </span>
                ${task.dueDate ? `<span class="tag" style="background: rgba(155, 89, 182, 0.2); color: #9b59b6;">
                    📅 ${formatDate(task.dueDate)}
                </span>` : ''}
            </div>
        </div>
    `;
}

// Drag and Drop Functions
function drag(event) {
    event.dataTransfer.setData('taskId', event.target.dataset.id);
    event.target.classList.add('dragging');
}

function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function dragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function drop(event) {
    event.preventDefault();
    const taskId = parseInt(event.dataTransfer.getData('taskId'));
    const newStatus = event.currentTarget.dataset.status;
    
    event.currentTarget.classList.remove('drag-over');
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveData();
        renderAllTasks();
        updateStats();
    }
}

// Stats Functions
function updateStats() {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'inProgress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const completion = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-todo').textContent = todo;
    document.getElementById('stat-progress').textContent = inProgress;
    document.getElementById('stat-done').textContent = done;
    document.getElementById('stat-completion').textContent = completion + '%';
}

// Modal Functions
function openCategoriesModal() {
    document.getElementById('categoriesModal').classList.add('active');
    renderCategoriesList();
}

function closeCategoriesModal() {
    document.getElementById('categoriesModal').classList.remove('active');
}



// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}