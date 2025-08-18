import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';
import { Task } from '../utils/types';
import AddEventModal from '../components/AddEventModal';

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  // Direct Firestore state management (exactly like your test page)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar visibility state
  const [visibleCategories, setVisibleCategories] = useState({
    work: true,
    personal: true,
    health: true,
    family: true
  });

  // Priority visibility state
  const [visiblePriorities, setVisiblePriorities] = useState({
    low: true,
    medium: true,
    high: true
  });

  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('week');

  // Check for modal state in URL
  const isModalOpen = searchParams.get('modal') === 'add-event';
  const editTaskId = searchParams.get('edit');
  const modalDate = searchParams.get('date');

  // Load tasks from Firestore (using the EXACT same approach as your test page)
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    console.log('Setting up Firestore listener for user:', currentUser.email);
    const userEventsCollection = collection(db, 'users', currentUser.uid, 'events');
    
    // Set up real-time listener (just like your test page)
    const unsubscribe = onSnapshot(userEventsCollection, (snapshot) => {
      console.log('Firestore snapshot received, docs count:', snapshot.docs.length);
      const loadedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Loading task:', doc.id, data);
        loadedTasks.push({
          id: doc.id,
          ...data
        } as Task);
      });
      console.log('Total tasks loaded:', loadedTasks.length);
      setTasks(loadedTasks);
      setLoading(false);
    }, (error) => {
      console.error('Error loading tasks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Set editing task when URL changes
  useEffect(() => {
    if (editTaskId) {
      const taskToEdit = tasks.find(task => task.id === editTaskId);
      setEditingTask(taskToEdit || null);
    } else {
      setEditingTask(null);
    }
  }, [editTaskId, tasks]);

  // Save task function (using EXACT same approach as your test page)
  const handleSaveTask = async (task: Task) => {
    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    console.log('Saving task:', task);
    
    try {
      const userEventsCollection = collection(db, 'users', currentUser.uid, 'events');
      
      if (task.id && task.id.startsWith('task_')) {
        // This is an existing task being updated
        const existingTask = tasks.find(t => t.id === task.id);
        if (existingTask) {
          console.log('Updating existing task:', task.id);
          const taskDoc = doc(db, 'users', currentUser.uid, 'events', task.id);
          const { id, ...taskData } = task;
          await updateDoc(taskDoc, {
            ...taskData,
            updatedAt: new Date().toISOString()
          });
          console.log('Task updated successfully');
        } else {
          // ID exists but task not found, create new one
          console.log('Creating new task (ID not found in existing tasks)');
          const { id, ...taskData } = task;
          const docRef = await addDoc(userEventsCollection, {
            ...taskData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log('New task created with ID:', docRef.id);
        }
      } else {
        // Create new task (exactly like your test page)
        console.log('Creating new task');
        const { id, ...taskData } = task; // Remove the temporary ID
        const docRef = await addDoc(userEventsCollection, {
          ...taskData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('New task created with ID:', docRef.id);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task. Please try again.');
    }
  };

  // Delete task function
  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser) return;

    console.log('Deleting task:', taskId);
    
    try {
      const taskDoc = doc(db, 'users', currentUser.uid, 'events', taskId);
      await deleteDoc(taskDoc);
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task. Please try again.');
    }
  };

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get week range with proper month handling
  const getWeekRange = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startMonth = monthNames[startOfWeek.getMonth()];
    const endMonth = monthNames[endOfWeek.getMonth()];
    const startDate = startOfWeek.getDate();
    const endDate = endOfWeek.getDate();
    
    // If same month
    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startMonth} ${startDate} – ${endDate}`;
    } else {
      // Different months
      return `${startMonth} ${startDate} – ${endMonth} ${endDate}`;
    }
  };

  // Generate mini calendar for sidebar
  const generateMiniCalendar = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentCalendarDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentCalendarDate));
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }
    return days;
  };

  // Generate current week
  const getCurrentWeek = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Filter tasks by date, category visibility, and priority visibility
  const getTasksForDate = (date: string) => {
    return tasks.filter(task => 
      task.date === date && 
      visibleCategories[task.category] && 
      visiblePriorities[task.priority]
    );
  };

  // Get all visible tasks
  const getVisibleTasks = () => {
    return tasks.filter(task => 
      visibleCategories[task.category] && 
      visiblePriorities[task.priority]
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Modal handlers
  const openModal = (date?: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'add-event');
    if (date) params.set('date', date);
    setSearchParams(params);
  };

  const closeModal = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('modal');
    params.delete('date');
    params.delete('edit');
    setSearchParams(params);
  };

  const handleEditTask = (task: Task) => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'add-event');
    params.set('edit', task.id);
    setSearchParams(params);
  };

  // Time slot click handler for creating events
  const handleTimeSlotClick = (date: Date, hour: number) => {
    const dateString = formatDate(date);
    // Convert display hour back to actual hour (6 AM = hour 6, etc.)
    const actualHour = hour >= 18 ? hour : hour + 6; // Handle wrap-around for late night hours
    const timeString = `${actualHour.toString().padStart(2, '0')}:00`;
    
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'add-event');
    params.set('date', dateString);
    params.set('time', timeString);
    setSearchParams(params);
  };

  // Toggle category visibility
  const toggleCategoryVisibility = (category: 'work' | 'personal' | 'health' | 'family') => {
    setVisibleCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggle priority visibility
  const togglePriorityVisibility = (priority: 'low' | 'medium' | 'high') => {
    setVisiblePriorities(prev => ({
      ...prev,
      [priority]: !prev[priority]
    }));
  };

  // Helper function to format hour display starting from 6 AM
  const formatHourDisplay = (displayIndex: number) => {
    // displayIndex 0 = 6 AM, displayIndex 1 = 7 AM, etc.
    // displayIndex 18 = 12 AM (midnight), displayIndex 23 = 5 AM
    const actualHour = displayIndex < 18 ? displayIndex + 6 : displayIndex - 18;
    
    if (actualHour === 0) return '12 AM';
    if (actualHour < 12) return `${actualHour} AM`;
    if (actualHour === 12) return '12 PM';
    return `${actualHour - 12} PM`;
  };

  // Helper function to calculate position for events
  const getEventPosition = (startTime: string) => {
    const [hour, minute] = startTime.split(':').map(Number);
    
    // Convert actual hour to display position (6 AM = position 0)
    let displayPosition;
    if (hour >= 6) {
      displayPosition = hour - 6; // 6 AM = 0, 7 AM = 1, etc.
    } else {
      displayPosition = hour + 18; // 12 AM = 18, 1 AM = 19, etc.
    }
    
    return (displayPosition * 64) + (minute * 64 / 60);
  };

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekDaysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const currentWeek = getCurrentWeek();
  const miniCalendarDays = generateMiniCalendar();

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">Please log in to access your calendar</div>
          <a href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Left Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
        
        {/* Sidebar Toggle Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-400 text-lg">
              {sidebarCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>

        {/* Mini Calendar - only show when expanded */}
        {!sidebarCollapsed && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {monthNames[month]}
              </h2>
              <div className="flex space-x-1">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <span className="text-gray-600 dark:text-gray-400">‹</span>
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <span className="text-gray-600 dark:text-gray-400">›</span>
                </button>
              </div>
            </div>

            {/* Mini Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <div key={day} className="text-xs text-gray-500 dark:text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {miniCalendarDays.map((date, index) => {
                const dateString = formatDate(date);
                const isCurrentMonth = date.getMonth() === month;
                const isToday = formatDate(date) === formatDate(today);
                const hasTask = getTasksForDate(dateString).length > 0;

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentDate(new Date(date))}
                    className={`w-8 h-8 text-sm rounded-full flex items-center justify-center transition-colors ${
                      isCurrentMonth
                        ? 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'text-gray-400 dark:text-gray-500'
                    } ${
                      isToday ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                    } ${
                      hasTask && !isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar Categories - only show when expanded */}
        {!sidebarCollapsed && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">MY CALENDARS</h3>
            <div className="space-y-2">
              {[
                { name: 'Work', color: 'bg-green-500', category: 'work' as const },
                { name: 'Personal', color: 'bg-yellow-500', category: 'personal' as const },
                { name: 'Health', color: 'bg-red-500', category: 'health' as const },
                { name: 'Family Events', color: 'bg-purple-500', category: 'family' as const },
              ].map((calendar) => {
                const count = tasks.filter(t => t.category === calendar.category).length;
                return (
                  <div key={calendar.name} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={visibleCategories[calendar.category]}
                      onChange={() => toggleCategoryVisibility(calendar.category)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className={`w-3 h-3 rounded-full ${calendar.color}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {calendar.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Priority Filters - only show when expanded */}
        {!sidebarCollapsed && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">PRIORITY</h3>
            <div className="space-y-2">
              {[
                { name: 'High Priority', color: 'bg-red-500', priority: 'high' as const },
                { name: 'Medium Priority', color: 'bg-yellow-500', priority: 'medium' as const },
                { name: 'Low Priority', color: 'bg-green-500', priority: 'low' as const },
              ].map((priorityFilter) => {
                const count = tasks.filter(t => t.priority === priorityFilter.priority).length;
                return (
                  <div key={priorityFilter.name} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={visiblePriorities[priorityFilter.priority]}
                      onChange={() => togglePriorityVisibility(priorityFilter.priority)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className={`w-3 h-3 rounded-full ${priorityFilter.color}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {priorityFilter.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsed sidebar - show just colored dots */}
        {sidebarCollapsed && (
          <div className="px-2 py-4 space-y-6">
            {/* Category dots */}
            <div className="space-y-3">
              {[
                { color: 'bg-green-500', category: 'work' as const },
                { color: 'bg-yellow-500', category: 'personal' as const },
                { color: 'bg-red-500', category: 'health' as const },
                { color: 'bg-purple-500', category: 'family' as const },
              ].map((calendar, index) => (
                <button
                  key={index}
                  onClick={() => toggleCategoryVisibility(calendar.category)}
                  className={`w-3 h-3 rounded-full ${calendar.color} mx-auto block transition-opacity ${
                    visibleCategories[calendar.category] ? 'opacity-100' : 'opacity-30'
                  }`}
                ></button>
              ))}
            </div>

            {/* Priority dots */}
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {[
                { color: 'bg-red-500', priority: 'high' as const },
                { color: 'bg-yellow-500', priority: 'medium' as const },
                { color: 'bg-green-500', priority: 'low' as const },
              ].map((priorityFilter, index) => (
                <button
                  key={index}
                  onClick={() => togglePriorityVisibility(priorityFilter.priority)}
                  className={`w-3 h-3 rounded-full ${priorityFilter.color} mx-auto block transition-opacity ${
                    visiblePriorities[priorityFilter.priority] ? 'opacity-100' : 'opacity-30'
                  }`}
                ></button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getWeekRange()}
            </h1>
            <div className="flex space-x-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <span className="text-gray-600 dark:text-gray-400">‹</span>
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                TODAY
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <span className="text-gray-600 dark:text-gray-400">›</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['day', 'week', 'month'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setViewType(view)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewType === view
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>

            <button 
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Event
            </button>
          </div>
        </div>

        {/* Week View */}
        <div className="flex-1 overflow-auto">
          {/* Week Header */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <div className="w-16 p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center border-r border-gray-200 dark:border-gray-700">
              ALL DAY
            </div>
            <div className="flex-1 grid grid-cols-7">
              {currentWeek.map((date, index) => {
                const isToday = formatDate(date) === formatDate(today);
                return (
                  <div
                    key={index}
                    className={`p-4 text-center border-l border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => openModal(formatDate(date))}
                  >
                    <div className={`text-lg font-semibold ${
                      isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className={`text-sm ${
                      isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {weekDaysShort[index]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Grid */}
          <div className="relative">
            {/* Time Labels - Now showing 6 AM to 5 AM next day */}
            <div className="absolute left-0 top-0 w-16 h-full">
              {Array.from({ length: 24 }, (_, displayIndex) => (
                <div
                  key={displayIndex}
                  className="h-16 flex items-start justify-end pr-2 text-xs text-gray-500 dark:text-gray-400"
                >
                  {formatHourDisplay(displayIndex)}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="ml-16 grid grid-cols-7 relative">
              {/* Background Grid */}
              {Array.from({ length: 24 * 7 }, (_, index) => {
                const displayHour = Math.floor(index / 7); // 0-23 display positions
                const day = index % 7;
                const date = currentWeek[day];
                
                return (
                  <div
                    key={index}
                    className="h-16 border-r border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => handleTimeSlotClick(date, displayHour)}
                  ></div>
                );
              })}

              {/* Events */}
              {currentWeek.map((date, dayIndex) => {
                const dayTasks = getTasksForDate(formatDate(date));
                return dayTasks.map((task, taskIndex) => {
                  if (!task.startTime) return null;
                  
                  const top = getEventPosition(task.startTime);
                  const left = dayIndex * (100 / 7);
                  
                  // Calculate height based on duration
                  let height = 48; // default 1 hour
                  if (task.endTime) {
                    const [startHour, startMinute] = task.startTime.split(':').map(Number);
                    const [endHour, endMinute] = task.endTime.split(':').map(Number);
                    const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                    height = Math.max(24, (durationMinutes * 64) / 60); // minimum 24px height
                  }
                  
                  // Fixed category color mapping
                  const categoryColors = {
                   work: 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300',
                   personal: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300',
                   health: 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300',
                   family: 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300'
                 };

                 return (
                   <div
                     key={`${task.id}-${dayIndex}`}
                     className={`absolute rounded-lg p-2 m-1 border-l-4 cursor-pointer hover:shadow-md transition-shadow group ${categoryColors[task.category]}`}
                     style={{
                       top: `${top}px`,
                       left: `${left}%`,
                       width: `${100 / 7 - 1}%`,
                       height: `${height}px`,
                     }}
                     onClick={(e) => {
                       e.stopPropagation();
                       handleEditTask(task);
                     }}
                   >
                     <div className="text-sm font-medium truncate">{task.title}</div>
                     <div className="text-xs opacity-75">
                       {task.allDay ? 'All day' : `${task.startTime} - ${task.endTime}`}
                     </div>
                     {task.location && (
                       <div className="text-xs opacity-60 truncate">📍 {task.location}</div>
                     )}
                     
                     {/* Delete button on hover */}
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         if (window.confirm('Are you sure you want to delete this event?')) {
                           handleDeleteTask(task.id);
                         }
                       }}
                       className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-opacity hover:bg-red-600"
                     >
                       ×
                     </button>
                   </div>
                 );
               });
             })}
           </div>
         </div>
       </div>
     </div>

     {/* Add Event Modal */}
     <AddEventModal
       isOpen={isModalOpen}
       onClose={closeModal}
       onSave={handleSaveTask}
       editingTask={editingTask}
       selectedDate={modalDate || undefined}
     />
   </div>
 );
}

export default CalendarPage;