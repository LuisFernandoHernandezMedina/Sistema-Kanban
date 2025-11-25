// ============================================
// INDEXEDDB HANDLER - db.js
// ============================================

const DB_NAME = 'KanbanDB';
const DB_VERSION = 1;
let db = null;

// ============================================
// INICIALIZACIÓN DE LA BASE DE DATOS
// ============================================

/**
 * Inicializa y abre la conexión a IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Se ejecuta solo cuando se crea la BD o se actualiza la versión
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('🔧 Configurando base de datos...');

            // Crear Object Store para tareas si no existe
            if (!db.objectStoreNames.contains('tasks')) {
                const taskStore = db.createObjectStore('tasks', { 
                    keyPath: 'id',
                    autoIncrement: false 
                });
                
                // Crear índices para búsquedas más rápidas
                taskStore.createIndex('status', 'status', { unique: false });
                taskStore.createIndex('priority', 'priority', { unique: false });
                taskStore.createIndex('category', 'category', { unique: false });
                taskStore.createIndex('dueDate', 'dueDate', { unique: false });
                taskStore.createIndex('createdAt', 'createdAt', { unique: false });
                
                console.log('✅ Object Store "tasks" creado');
            }

            // Crear Object Store para categorías si no existe
            if (!db.objectStoreNames.contains('categories')) {
                const categoryStore = db.createObjectStore('categories', { 
                    keyPath: 'id',
                    autoIncrement: false 
                });
                
                categoryStore.createIndex('name', 'name', { unique: false });
                
                console.log('✅ Object Store "categories" creado');
            }

            // Crear Object Store para historial si no existe
            if (!db.objectStoreNames.contains('history')) {
                const historyStore = db.createObjectStore('history', { 
                    keyPath: 'id',
                    autoIncrement: true 
                });
                
                historyStore.createIndex('taskId', 'taskId', { unique: false });
                historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                historyStore.createIndex('action', 'action', { unique: false });
                
                console.log('✅ Object Store "history" creado');
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('✅ Base de datos abierta correctamente');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('❌ Error al abrir la base de datos:', event.target.error);
            reject(event.target.error);
        };

        request.onblocked = () => {
            console.warn('⚠️ La base de datos está bloqueada');
        };
    });
}

// ============================================
// OPERACIONES CON TAREAS
// ============================================

/**
 * Obtener todas las tareas
 * @returns {Promise<Array>}
 */
function getAllTasks() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Obtener una tarea por ID
 * @param {number} id 
 * @returns {Promise<Object>}
 */
function getTaskById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Obtener tareas por estado
 * @param {string} status - 'todo', 'inProgress', 'done'
 * @returns {Promise<Array>}
 */
function getTasksByStatus(status) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readonly');
        const store = transaction.objectStore('tasks');
        const index = store.index('status');
        const request = index.getAll(status);

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Agregar nueva tarea
 * @param {Object} task 
 * @returns {Promise<number>}
 */
function addTask(task) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        
        // Asegurar que tenga ID y fecha de creación
        if (!task.id) {
            task.id = Date.now();
        }
        if (!task.createdAt) {
            task.createdAt = new Date().toISOString();
        }
        
        const request = store.add(task);

        request.onsuccess = () => {
            console.log('✅ Tarea agregada:', task.id);
            resolve(task.id);
        };

        request.onerror = () => {
            console.error('❌ Error al agregar tarea:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Actualizar tarea existente
 * @param {Object} task 
 * @returns {Promise<number>}
 */
function updateTask(task) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        
        task.updatedAt = new Date().toISOString();
        
        const request = store.put(task);

        request.onsuccess = () => {
            console.log('✅ Tarea actualizada:', task.id);
            resolve(task.id);
        };

        request.onerror = () => {
            console.error('❌ Error al actualizar tarea:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Eliminar tarea
 * @param {number} id 
 * @returns {Promise<void>}
 */
function deleteTask(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log('✅ Tarea eliminada:', id);
            resolve();
        };

        request.onerror = () => {
            console.error('❌ Error al eliminar tarea:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Eliminar todas las tareas
 * @returns {Promise<void>}
 */
function clearAllTasks() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const store = transaction.objectStore('tasks');
        const request = store.clear();

        request.onsuccess = () => {
            console.log('✅ Todas las tareas eliminadas');
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// ============================================
// OPERACIONES CON CATEGORÍAS
// ============================================

/**
 * Obtener todas las categorías
 * @returns {Promise<Array>}
 */
function getAllCategories() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Agregar nueva categoría
 * @param {Object} category 
 * @returns {Promise<string>}
 */
function addCategory(category) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        
        if (!category.createdAt) {
            category.createdAt = new Date().toISOString();
        }
        
        const request = store.add(category);

        request.onsuccess = () => {
            console.log('✅ Categoría agregada:', category.id);
            resolve(category.id);
        };

        request.onerror = () => {
            console.error('❌ Error al agregar categoría:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Actualizar categoría existente
 * @param {Object} category 
 * @returns {Promise<string>}
 */
function updateCategory(category) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.put(category);

        request.onsuccess = () => {
            console.log('✅ Categoría actualizada:', category.id);
            resolve(category.id);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Eliminar categoría
 * @param {string} id 
 * @returns {Promise<void>}
 */
function deleteCategory(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log('✅ Categoría eliminada:', id);
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * Inicializar categorías predeterminadas
 * @returns {Promise<void>}
 */
async function initDefaultCategories() {
    const categories = await getAllCategories();
    
    if (categories.length === 0) {
        const defaults = [
            { id: 'general', name: 'General', color: '#3498db' },
            { id: 'trabajo', name: 'Trabajo', color: '#9b59b6' },
            { id: 'personal', name: 'Personal', color: '#1abc9c' },
            { id: 'urgente', name: 'Urgente', color: '#e74c3c' }
        ];

        for (const cat of defaults) {
            await addCategory(cat);
        }
        
        console.log('✅ Categorías predeterminadas creadas');
    }
}

// ============================================
// OPERACIONES AVANZADAS
// ============================================

/**
 * Obtener estadísticas de tareas
 * @returns {Promise<Object>}
 */
async function getTaskStats() {
    const tasks = await getAllTasks();
    
    return {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'inProgress').length,
        done: tasks.filter(t => t.status === 'done').length,
        byPriority: {
            baja: tasks.filter(t => t.priority === 'baja').length,
            media: tasks.filter(t => t.priority === 'media').length,
            alta: tasks.filter(t => t.priority === 'alta').length
        }
    };
}

/**
 * Buscar tareas por texto
 * @param {string} searchTerm 
 * @returns {Promise<Array>}
 */
async function searchTasks(searchTerm) {
    const tasks = await getAllTasks();
    const term = searchTerm.toLowerCase();
    
    return tasks.filter(task => 
        task.title.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term))
    );
}

/**
 * Obtener tareas que vencen pronto
 * @param {number} days - Número de días
 * @returns {Promise<Array>}
 */
async function getTasksDueSoon(days = 7) {
    const tasks = await getAllTasks();
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= futureDate;
    });
}

/**
 * Exportar todos los datos
 * @returns {Promise<Object>}
 */
async function exportAllData() {
    const tasks = await getAllTasks();
    const categories = await getAllCategories();
    
    return {
        tasks,
        categories,
        exportDate: new Date().toISOString(),
        version: DB_VERSION
    };
}

/**
 * Importar datos
 * @param {Object} data 
 * @returns {Promise<void>}
 */
async function importData(data) {
    try {
        // Limpiar datos existentes
        await clearAllTasks();
        
        // Importar tareas
        if (data.tasks && Array.isArray(data.tasks)) {
            for (const task of data.tasks) {
                await addTask(task);
            }
        }
        
        // Importar categorías (sin eliminar las existentes)
        if (data.categories && Array.isArray(data.categories)) {
            for (const category of data.categories) {
                try {
                    await addCategory(category);
                } catch (error) {
                    // Si la categoría ya existe, actualizarla
                    await updateCategory(category);
                }
            }
        }
        
        console.log('✅ Datos importados correctamente');
    } catch (error) {
        console.error('❌ Error al importar datos:', error);
        throw error;
    }
}

// ============================================
// MIGRACIÓN DESDE LOCALSTORAGE
// ============================================

/**
 * Migrar datos desde LocalStorage a IndexedDB
 * @returns {Promise<boolean>}
 */
async function migrateFromLocalStorage() {
    try {
        const savedTasks = localStorage.getItem('kanbanTasks');
        const savedCategories = localStorage.getItem('kanbanCategories');
        
        if (!savedTasks && !savedCategories) {
            console.log('ℹ️ No hay datos en LocalStorage para migrar');
            return false;
        }
        
        console.log('🔄 Migrando datos desde LocalStorage...');
        
        // Migrar tareas
        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            for (const task of tasks) {
                await addTask(task);
            }
            console.log(`✅ ${tasks.length} tareas migradas`);
        }
        
        // Migrar categorías
        if (savedCategories) {
            const categories = JSON.parse(savedCategories);
            for (const category of categories) {
                try {
                    await addCategory(category);
                } catch (error) {
                    // Categoría ya existe
                }
            }
            console.log(`✅ ${categories.length} categorías migradas`);
        }
        
        // Opcional: Limpiar LocalStorage después de migrar
        // localStorage.removeItem('kanbanTasks');
        // localStorage.removeItem('kanbanCategories');
        
        return true;
    } catch (error) {
        console.error('❌ Error al migrar datos:', error);
        return false;
    }
}

// ============================================
// UTILIDADES DE MANTENIMIENTO
// ============================================

/**
 * Obtener información de la base de datos
 * @returns {Promise<Object>}
 */
async function getDatabaseInfo() {
    const tasks = await getAllTasks();
    const categories = await getAllCategories();
    
    return {
        name: DB_NAME,
        version: DB_VERSION,
        tasksCount: tasks.length,
        categoriesCount: categories.length,
        stores: Array.from(db.objectStoreNames)
    };
}

/**
 * Eliminar completamente la base de datos
 * @returns {Promise<void>}
 */
function deleteDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close();
        }
        
        const request = indexedDB.deleteDatabase(DB_NAME);
        
        request.onsuccess = () => {
            console.log('✅ Base de datos eliminada');
            db = null;
            resolve();
        };
        
        request.onerror = () => {
            console.error('❌ Error al eliminar base de datos');
            reject(request.error);
        };
        
        request.onblocked = () => {
            console.warn('⚠️ Eliminación bloqueada - cierra otras pestañas');
        };
    });
}