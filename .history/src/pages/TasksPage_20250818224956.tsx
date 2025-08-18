import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  color: string;
  estimatedHours: number;
}

const CARD_COLORS = [
  'bg-gradient-to-br from-rose-100 to-pink-100',        // Soft rose
  'bg-gradient-to-br from-blue-100 to-indigo-100',      // Gentle blue
  'bg-gradient-to-br from-emerald-50 to-teal-100',      // Much softer green
  'bg-gradient-to-br from-violet-100 to-purple-100',    // Lavender
  'bg-gradient-to-br from-amber-50 to-yellow-100',      // Creamy yellow
  'bg-gradient-to-br from-slate-100 to-gray-100',       // Soft gray
  'bg-gradient-to-br from-orange-50 to-peach-100',      // Gentle peach
  'bg-gradient-to-br from-cyan-50 to-sky-100',          // Light cyan
  'bg-gradient-to-br from-lime-50 to-green-100',        // Fresh lime
  'bg-gradient-to-br from-fuchsia-100 to-pink-100',     // Soft fuchsia
  'bg-gradient-to-br from-indigo-50 to-blue-100',       // Powder blue
  'bg-gradient-to-br from-red-50 to-rose-100',          // Blush
];

const MAX_DESCRIPTION_LENGTH = 500;

function TasksPage() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskHours, setNewTaskHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editHours, setEditHours] = useState(1);

  useEffect(() => {
    if (!currentUser) return;
    const userTasksCollection = collection(db, 'users', currentUser.uid, 'tasks');
    const q = query(userTasksCollection, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(tasksData);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, setValue: (value: string) => void, currentValue: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Submit form on Enter without Shift
      const form = e.currentTarget.closest('form');
      if (form) {
        form.requestSubmit();
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow new line on Shift+Enter, but check character limit
      if (currentValue.length >= MAX_DESCRIPTION_LENGTH) {
        e.preventDefault();
        toast.error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
      }
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>, setValue: (value: string) => void) => {
    const value = e.target.value;
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setValue(value);
    } else {
      toast.error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentUser) return;
    setLoading(true);
    try {
      const userTasksCollection = collection(db, 'users', currentUser.uid, 'tasks');
      await addDoc(userTasksCollection, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
        estimatedHours: newTaskHours,
      });
      
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskHours(1);
      setShowAddForm(false);
      toast.success('Task added!');
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!currentUser) return;
    try {
      const taskDoc = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await updateDoc(taskDoc, {
        completed: !completed,
        updatedAt: new Date().toISOString()
      });
      toast.success(!completed ? 'Task completed!' : 'Task moved back to active');
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser) return;
    try {
      const taskDoc = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await deleteDoc(taskDoc);
      toast.success('Task deleted!');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditHours(task.estimatedHours);
  };

  const saveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !currentUser || !editingTask) return;
    setLoading(true);
    try {
      const taskDoc = doc(db, 'users', currentUser.uid, 'tasks', editingTask.id);
      await updateDoc(taskDoc, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        estimatedHours: editHours,
        updatedAt: new Date().toISOString()
      });
      
      setEditingTask(null);
      setEditTitle('');
      setEditDesc('');
      setEditHours(1);
      toast.success('Task updated!');
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditDesc('');
    setEditHours(1);
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-300 rounded-full mb-4 mx-auto flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Please log in to view tasks</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Tasks</h1>
              <p className="text-gray-600">Manage your tasks with style and efficiency</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="px-6 py-3 rounded-xl font-medium transition-all bg-blue-600 text-white hover:bg-blue-700"
              >
                {showCompleted ? 'Show Active' : 'Show Completed'}
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Add Task
              </button>
            </div>
          </div>

          {/* Add Task Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                <div className="bg-white rounded-2xl shadow-lg p-6 border">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Create New Task</h3>
                  <form onSubmit={addTask} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                        required
                      />
                      <div className="relative">
                        <textarea
                          value={newTaskDesc}
                          onChange={(e) => handleDescriptionChange(e, setNewTaskDesc)}
                          onKeyDown={(e) => handleDescriptionKeyDown(e, setNewTaskDesc, newTaskDesc)}
                          placeholder="Task description (optional)... Press Shift+Enter for new line"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          disabled={loading}
                          rows={3}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {newTaskDesc.length}/{MAX_DESCRIPTION_LENGTH}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours To Complete</label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={newTaskHours}
                          onChange={(e) => setNewTaskHours(parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading || !newTaskTitle.trim()}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                        {loading ? 'Adding...' : 'Create Task'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Task Form */}
          <AnimatePresence>
            {editingTask && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                <div className="bg-white rounded-2xl shadow-lg p-6 border">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Edit Task</h3>
                  <form onSubmit={saveEditTask} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Task title..."
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                        required
                      />
                      <div className="relative">
                        <textarea
                          value={editDesc}
                          onChange={(e) => handleDescriptionChange(e, setEditDesc)}
                          onKeyDown={(e) => handleDescriptionKeyDown(e, setEditDesc, editDesc)}
                          placeholder="Task description (optional)..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          disabled={loading}
                          rows={3}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {editDesc.length}/{MAX_DESCRIPTION_LENGTH}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={editHours}
                          onChange={(e) => setEditHours(parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading || !editTitle.trim()}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section Headers */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              {showCompleted ? (
                <>Completed <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">{completedTasks.length}</span></>
              ) : (
                <>Active <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{pendingTasks.length}</span></>
              )}
            </h2>
            {!showCompleted && (
              <div className="text-sm text-gray-500">
                Total hours: {pendingTasks.reduce((sum, task) => sum + task.estimatedHours, 0)}h
              </div>
            )}
          </div>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {(showCompleted ? completedTasks : pendingTasks).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${task.color} rounded-2xl p-6 text-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer relative group flex flex-col min-h-[200px]`}
                >
                  {/* Task Number */}
                  <div className="absolute top-4 left-4">
                    <span className="text-lg font-bold text-gray-600">#{(index + 1).toString().padStart(2, '0')}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {/* Edit Button - Only for active tasks */}
                    {!task.completed && (
                      <button
                        onClick={() => startEditTask(task)}
                        className="bg-white bg-opacity-70 hover:bg-opacity-90 rounded-full w-8 h-8 flex items-center justify-center text-sm"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="bg-white bg-opacity-70 hover:bg-opacity-90 rounded-full w-8 h-8 flex items-center justify-center text-sm"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Task Content */}
                  <div className="mt-8 mb-4 flex-grow">
                    <h3 className="font-bold text-lg mb-2" title={task.title}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap break-words" title={task.description}>
                        {task.description}
                      </div>
                    )}
                  </div>

                  {/* Task Meta */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-sm font-medium text-gray-700">
                      {task.estimatedHours} hr{task.estimatedHours !== 1 ? 's' : ''}
                    </div>
                    
                    <button
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`w-8 h-8 rounded-full border-2 border-gray-600 flex items-center justify-center transition-all hover:scale-110 z-10 ${
                        task.completed ? 'bg-gray-600 text-white' : 'bg-transparent hover:bg-gray-600 hover:bg-opacity-20'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Progress indicator for completed tasks */}
                  {task.completed && (
                    <div className="absolute inset-0 bg-black bg-opacity-10 rounded-2xl flex items-center justify-center z-0">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Add New Task Card */}
              {!showCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group min-h-[200px]"
                  onClick={() => setShowAddForm(true)}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2 mx-auto group-hover:bg-blue-100 transition-colors">
                      <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">Add New Task</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {(showCompleted ? completedTasks : pendingTasks).length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-gray-200 rounded-full mb-4 mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {showCompleted ? 'No completed tasks yet!' : 'No active tasks!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {showCompleted 
                  ? 'Complete some tasks to see them here.' 
                  : 'Create your first task to get started.'
                }
              </p>
              {!showCompleted && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg"
                >
                  Create First Task
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TasksPage;