import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';
import { useDarkMode } from '../utils/DarkModeContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  category: string;
  dueDate?: Date | Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId: string;
  progress: number;
  subtasks: Subtask[];
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskFilters {
  category: string;
  priority: string;
  status: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'dueDate' | 'priority' | 'created' | 'progress';
  sortOrder: 'asc' | 'desc';
}

const Icons = {
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.121A1 1 0 013 6.414V4z" />
    </svg>
  ),
  MoreVertical: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
};

// Utility functions
const formatDate = (date: Date | Timestamp | null | undefined): string => {
  if (!date) return 'No due date';
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (dateObj.toDateString() === today.toDateString()) return 'Today';
  if (dateObj.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return dateObj.toLocaleDateString();
};

const isOverdue = (date: Date | Timestamp | null | undefined): boolean => {
  if (!date) return false;
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return dateObj < new Date();
};

function TasksPage(): React.JSX.Element {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [activeView, setActiveView] = useState<'category' | 'list' | 'history'>('category');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<TaskFilters>({
    category: 'all',
    priority: 'all',
    status: 'all',
    dateRange: 'all',
    sortBy: 'created',
    sortOrder: 'desc'
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    dueDate: '',
  });

  // Fetch active tasks
  useEffect(() => {
    if (!currentUser) return;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid),
      where('status', '!=', 'completed'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch completed tasks
  useEffect(() => {
    if (!currentUser) return;

    const completedQuery = query(
      collection(db, 'completedTasks'),
      where('userId', '==', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(completedQuery, (snapshot) => {
      const completedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setCompletedTasks(completedData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Task operations
  const addTask = async () => {
    if (!currentUser || !newTask.title.trim()) return;

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'todo' as const,
        category: newTask.category || 'General',
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: currentUser.uid,
        progress: 0,
        subtasks: []
      };

      await addDoc(collection(db, 'tasks'), taskData);
      
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        dueDate: '',
      });
      setShowAddTaskModal(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const markTaskComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Add to completed collection
      const completedTask = {
        ...task,
        status: 'completed' as const,
        updatedAt: Timestamp.now()
      };
      await addDoc(collection(db, 'completedTasks'), completedTask);

      // Remove from active tasks
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        progress,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'todo' | 'in-progress') => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Bulk operations
  const handleBulkComplete = async () => {
    try {
      const promises = Array.from(selectedTasks).map(taskId => markTaskComplete(taskId));
      await Promise.all(promises);
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Error completing tasks:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selectedTasks).map(taskId => 
        deleteDoc(doc(db, 'tasks', taskId))
      );
      await Promise.all(promises);
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  };

  // Helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'todo': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getUniqueCategories = (): string[] => {
    const categories = tasks.map(task => task.category).filter(Boolean);
    const uniqueCategories: string[] = [];
    const seen = new Set<string>();
    
    for (const category of categories) {
      if (!seen.has(category)) {
        seen.add(category);
        uniqueCategories.push(category);
      }
    }
    
    return uniqueCategories;
  };

  // Enhanced filtering and sorting
  const getFilteredAndSortedTasks = () => {
    let filtered = tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) && 
            !task.description?.toLowerCase().includes(searchLower) &&
            !task.category.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'all' && task.category !== filters.category) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all' && task.dueDate) {
        const taskDate = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : task.dueDate;
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            if (taskDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (taskDate > weekFromNow) return false;
            break;
          case 'month':
            const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            if (taskDate > monthFromNow) return false;
            break;
        }
      }

      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (filters.sortBy) {
        case 'dueDate':
          aVal = a.dueDate ? (a.dueDate instanceof Timestamp ? a.dueDate.toDate() : a.dueDate) : new Date('2099-12-31');
          bVal = b.dueDate ? (b.dueDate instanceof Timestamp ? b.dueDate.toDate() : b.dueDate) : new Date('2099-12-31');
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority];
          bVal = priorityOrder[b.priority];
          break;
        case 'progress':
          aVal = a.progress;
          bVal = b.progress;
          break;
        case 'created':
        default:
          aVal = a.createdAt?.toDate() || new Date(0);
          bVal = b.createdAt?.toDate() || new Date(0);
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredTasks = getFilteredAndSortedTasks();
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in-progress');
  const todoTasks = filteredTasks.filter(task => task.status === 'todo');

  // Task selection handler
  const handleTaskSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // Task Card Component
  const TaskCard = ({ task, showCheckbox = false }: { task: Task; showCheckbox?: boolean }) => {
    const isSelected = selectedTasks.has(task.id);
    const overdueStatus = task.dueDate && isOverdue(task.dueDate);

    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md ${
          isSelected 
            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
            : 'border-gray-200 dark:border-gray-700'
        } ${overdueStatus ? 'border-red-300 dark:border-red-700' : ''}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            {showCheckbox && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleTaskSelect(task.id)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {task.title}
                </h3>
                {overdueStatus && (
                  <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium">
                    Overdue
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span className="flex items-center space-x-1">
                  <Icons.Calendar />
                  <span>{formatDate(task.dueDate)}</span>
                </span>
                <span>•</span>
                <span>{task.category}</span>
              </div>
              {task.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Icons.MoreVertical />
          </button>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center justify-between mb-4">
          <select
            value={task.status}
            onChange={(e) => updateTaskStatus(task.id, e.target.value as 'todo' | 'in-progress')}
            className={`px-3 py-1 rounded-full text-xs font-medium text-white border-none ${getStatusColor(task.status)}`}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
          </select>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)} text-white`}>
            {task.priority}
          </span>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Progress</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
          
          {/* Progress Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateTaskProgress(task.id, Math.max(0, task.progress - 25))}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                -25%
              </button>
              <button
                onClick={() => updateTaskProgress(task.id, Math.min(100, task.progress + 25))}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                +25%
              </button>
            </div>
            <button
              onClick={() => markTaskComplete(task.id)}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
            >
              <Icons.Check />
              <span>Complete</span>
            </button>
          </div>
        </div>

        {/* Task Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span>Created {task.createdAt?.toDate().toLocaleDateString()}</span>
          <span>{task.subtasks?.length || 0} subtasks</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {tasks.length} total tasks, {completedTasks.length} completed
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
              >
                <Icons.Plus />
                <span>Add Task</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icons.Filter />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters & Sorting</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Categories</option>
                    {getUniqueCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                  <div className="flex space-x-2">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="created">Created</option>
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="progress">Progress</option>
                    </select>
                    <button
                      onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {filters.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setFilters({
                      category: 'all',
                      priority: 'all',
                      status: 'all',
                      dateRange: 'all',
                      sortBy: 'created',
                      sortOrder: 'desc'
                    });
                    setSearchQuery('');
                  }}
className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
               >
                 Clear All Filters
               </button>
             </div>
           </div>
         )}

         {/* Bulk Actions */}
         {selectedTasks.size > 0 && (
           <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
             <div className="flex items-center justify-between">
               <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                 {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
               </span>
               <div className="flex items-center space-x-3">
                 <button
                   onClick={handleBulkComplete}
                   className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                 >
                   Complete All
                 </button>
                 <button
                   onClick={handleBulkDelete}
                   className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                 >
                   Delete All
                 </button>
                 <button
                   onClick={() => setSelectedTasks(new Set())}
                   className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         )}
       </div>

       {/* View Toggle */}
       <div className="flex items-center space-x-4 mb-6">
         <button
           onClick={() => setActiveView('category')}
           className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
             activeView === 'category'
               ? 'bg-blue-600 text-white'
               : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
           }`}
         >
           <span>Category</span>
         </button>
         <button
           onClick={() => setActiveView('list')}
           className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
             activeView === 'list'
               ? 'bg-blue-600 text-white'
               : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
           }`}
         >
           <span>List View</span>
         </button>
         <button
           onClick={() => setActiveView('history')}
           className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
             activeView === 'history'
               ? 'bg-blue-600 text-white'
               : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
           }`}
         >
           <span>History</span>
         </button>
       </div>

       {/* Main Content */}
       {activeView === 'history' ? (
         /* History View */
         <div className="space-y-4">
           <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
             Completed Tasks ({completedTasks.length})
           </h2>
           <div className="grid gap-4">
             {completedTasks.map((task) => (
               <div
                 key={task.id}
                 className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 opacity-75"
               >
                 <div className="flex items-start justify-between mb-4">
                   <div className="flex-1">
                     <div className="flex items-center space-x-3 mb-2">
                       <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                       <h3 className="font-semibold text-gray-900 dark:text-white line-through">
                         {task.title}
                       </h3>
                       <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                         Completed
                       </span>
                     </div>
                     {task.description && (
                       <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                         {task.description}
                       </p>
                     )}
                     <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                       <span>{task.category}</span>
                       <span>•</span>
                       <span>Completed {task.updatedAt?.toDate().toLocaleDateString()}</span>
                     </div>
                   </div>
                 </div>
                 
                 {/* Completed Progress Bar */}
                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                   <div className="bg-green-600 h-2 rounded-full w-full"></div>
                 </div>
               </div>
             ))}
             {completedTasks.length === 0 && (
               <div className="text-center py-12">
                 <p className="text-gray-500 dark:text-gray-400">No completed tasks yet</p>
               </div>
             )}
           </div>
         </div>
       ) : activeView === 'list' ? (
         /* List View */
         <div className="space-y-4">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
               All Tasks ({filteredTasks.length})
             </h2>
             <button
               onClick={() => {
                 if (selectedTasks.size === filteredTasks.length) {
                   setSelectedTasks(new Set());
                 } else {
                   setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
                 }
               }}
               className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
             >
               {selectedTasks.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
             </button>
           </div>
           
           <div className="grid gap-4">
             {filteredTasks.map((task) => (
               <TaskCard key={task.id} task={task} showCheckbox={true} />
             ))}
             {filteredTasks.length === 0 && (
               <div className="text-center py-12">
                 <p className="text-gray-500 dark:text-gray-400">
                   {searchQuery || filters.category !== 'all' || filters.priority !== 'all' || filters.status !== 'all' 
                     ? 'No tasks match your filters' 
                     : 'No tasks yet. Create your first task!'}
                 </p>
               </div>
             )}
           </div>
         </div>
       ) : (
         /* Category View - Default */
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* In Progress Tasks */}
           <div>
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                 <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                 <span>In Progress ({inProgressTasks.length})</span>
               </h2>
               <Icons.ChevronDown />
             </div>
             
             <div className="space-y-4">
               {inProgressTasks.map((task) => (
                 <TaskCard key={task.id} task={task} />
               ))}
               {inProgressTasks.length === 0 && (
                 <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                   No tasks in progress
                 </div>
               )}
             </div>
           </div>

           {/* Todo Tasks */}
           <div>
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                 <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                 <span>To Do ({todoTasks.length})</span>
               </h2>
               <Icons.ChevronDown />
             </div>
             
             <div className="space-y-4">
               {todoTasks.map((task) => (
                 <div
                   key={task.id}
                   className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                 >
                   <div className="flex items-start justify-between mb-4">
                     <div className="flex-1">
                       <div className="flex items-center space-x-3 mb-2">
                         <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                         <h3 className="font-semibold text-gray-900 dark:text-white">
                           {task.title}
                         </h3>
                         {task.dueDate && isOverdue(task.dueDate) && (
                           <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium">
                             Overdue
                           </span>
                         )}
                       </div>
                       <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                         <span className="flex items-center space-x-1">
                           <Icons.Calendar />
                           <span>{formatDate(task.dueDate)}</span>
                         </span>
                         <span>•</span>
                         <span>{task.category}</span>
                       </div>
                       {task.description && (
                         <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                           {task.description}
                         </p>
                       )}
                     </div>
                   </div>

                   <div className="flex items-center justify-between">
                     <button
                       onClick={() => updateTaskStatus(task.id, 'in-progress')}
                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                     >
                       Start Task
                     </button>
                     <button
                       onClick={() => markTaskComplete(task.id)}
                       className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                     >
                       <Icons.Check />
                       <span>Complete</span>
                     </button>
                   </div>
                 </div>
               ))}
               {todoTasks.length === 0 && (
                 <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                   No pending tasks
                 </div>
               )}
             </div>
           </div>
         </div>
       )}
     </div>

     {/* Add Task Modal */}
     {showAddTaskModal && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
         <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Task</h2>
             <button
               onClick={() => setShowAddTaskModal(false)}
               className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
             >
               <Icons.X />
             </button>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 Task Title *
               </label>
               <input
                 type="text"
                 value={newTask.title}
                 onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="Enter task title..."
                 required
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 Description
               </label>
               <textarea
                 value={newTask.description}
                 onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                 rows={3}
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="Enter task description..."
               />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Priority
                 </label>
                 <select
                   value={newTask.priority}
                   onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   <option value="low">Low</option>
                   <option value="medium">Medium</option>
                   <option value="high">High</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Category
                 </label>
                 <input
                   type="text"
                   value={newTask.category}
                   onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="e.g., Work, Personal"
                   list="categories"
                 />
                 <datalist id="categories">
                   {getUniqueCategories().map(category => (
                     <option key={category} value={category} />
                   ))}
                 </datalist>
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 Due Date
               </label>
               <input
                 type="date"
                 value={newTask.dueDate}
                 onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                 min={new Date().toISOString().split('T')[0]}
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
             </div>
           </div>

           <div className="flex items-center justify-end space-x-3 mt-6">
             <button
               onClick={() => setShowAddTaskModal(false)}
               className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
             >
               Cancel
             </button>
             <button
               onClick={addTask}
               disabled={!newTask.title.trim()}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               Add Task
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}

export default TasksPage;