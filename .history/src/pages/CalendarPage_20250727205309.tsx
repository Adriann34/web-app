import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Task } from '../utils/types';
import AddEventModal from '../components/AddEventModal';

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Simple state management without undo/redo
  const [tasks, setTasks] = useState<Task[]>([
    // Sample data to visualize the layout
    {
      id: '1',
      title: 'Workout',
      description: 'Morning cardio session',
      date: '2025-07-28',
      startTime: '08:00',
      endTime: '09:00',
      allDay: false,
      completed: false,
      priority: 'high',
      category: 'health',
      location: 'Home Gym',
      reminders: [15],
      recurring: { type: 'none', interval: 1 },
      createdAt: '2025-07-27T10:00:00Z',
      updatedAt: '2025-07-27T10:00:00Z'
    },
    {
      id: '2',
      title: 'Team Meeting',
      description: 'Weekly standup with the development team',
      date: '2025-07-28',
      startTime: '10:00',
      endTime: '11:00',
      allDay: false,
      completed: false,
      priority: 'medium',
      category: 'work',
      location: 'Conference Room A',
      reminders: [15, 5],
      recurring: { type: 'weekly', interval: 1 },
      createdAt: '2025-07-27T10:00:00Z',
      updatedAt: '2025-07-27T10:00:00Z'
    },
    {
      id: '3',
      title: 'Lunch with Client',
      description: 'Business lunch discussion',
      date: '2025-07-29',
      startTime: '12:30',
      endTime: '13:30',
      allDay: false,
      completed: false,
      priority: 'high',
      category: 'work',
      location: 'Downtown Restaurant',
      reminders: [30],
      recurring: { type: 'none', interval: 1 },
      createdAt: '2025-07-27T10:00:00Z',
      updatedAt: '2025-07-27T10:00:00Z'
    }
  ]);

  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('week');

  // Check for modal state in URL
  const isModalOpen = searchParams.get('modal') === 'add-event';
  const editTaskId = searchParams.get('edit');
  const modalDate = searchParams.get('date');

  // Set editing task when URL changes
  useEffect(() => {
    if (editTaskId) {
      const taskToEdit = tasks.find(task => task.id === editTaskId);
      setEditingTask(taskToEdit || null);
    } else {
      setEditingTask(null);
    }
  }, [editTaskId, tasks]);

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

  const getTasksForDate = (date: string) => {
    return tasks.filter(task => task.date === date);
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

  const handleSaveTask = (task: Task) => {
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    if (existingIndex >= 0) {
      // Update existing task
      const updated = [...tasks];
      updated[existingIndex] = task;
      setTasks(updated);
    } else {
      // Add new task
      setTasks([...tasks, task]);
    }
  };

  const handleEditTask = (task: Task) => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'add-event');
    params.set('edit', task.id);
    setSearchParams(params);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
  };

  // Time slot click handler for creating events
  const handleTimeSlotClick = (date: Date, hour: number) => {
    const dateString = formatDate(date);
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'add-event');
    params.set('date', dateString);
    params.set('time', timeString);
    setSearchParams(params);
  };

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekDaysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const currentWeek = getCurrentWeek();
  const miniCalendarDays = generateMiniCalendar();

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
                { name: 'Work', color: 'bg-green-500', count: tasks.filter(t => t.category === 'work').length },
                { name: 'Personal', color: 'bg-yellow-500', count: tasks.filter(t => t.category === 'personal').length },
                { name: 'Health', color: 'bg-red-500', count: tasks.filter(t => t.category === 'health').length },
                { name: 'Family Events', color: 'bg-purple-500', count: tasks.filter(t => t.category === 'family').length },
              ].map((calendar) => (
                <div key={calendar.name} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className={`w-3 h-3 rounded-full ${calendar.color}`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {calendar.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {calendar.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed sidebar - show just colored dots */}
        {sidebarCollapsed && (
          <div className="px-2 py-4">
            <div className="space-y-3">
              {[
                { color: 'bg-green-500' },
                { color: 'bg-yellow-500' },
                { color: 'bg-red-500' },
                { color: 'bg-purple-500' },
              ].map((calendar, index) => (
                <div key={index} className="flex justify-center">
                  <div className={`w-3 h-3 rounded-full ${calendar.color}`}></div>
                </div>
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
            {/* Time Labels */}
            <div className="absolute left-0 top-0 w-16 h-full">
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className="h-16 flex items-start justify-end pr-2 text-xs text-gray-500 dark:text-gray-400"
                >
                  {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="ml-16 grid grid-cols-7 relative">
              {/* Background Grid */}
              {Array.from({ length: 24 * 7 }, (_, index) => {
                const hour = Math.floor(index / 7);
                const day = index % 7;
                const date = currentWeek[day];
                
                return (
                  <div
                    key={index}
                    className="h-16 border-r border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => handleTimeSlotClick(date, hour)}
                  ></div>
                );
              })}

              {/* Events */}
              {currentWeek.map((date, dayIndex) => {
                const dayTasks = getTasksForDate(formatDate(date));
                return dayTasks.map((task, taskIndex) => {
                  if (!task.startTime) return null;
                  
                  const [hour, minute] = task.startTime.split(':').map(Number);
                  const top = (hour * 64) + (minute * 64 / 60);
                  const left = dayIndex * (100 / 7);
                  
                  // Calculate height based on duration
                  let height = 48; // default 1 hour
                  if (task.endTime) {
                    const [endHour, endMinute] = task.endTime.split(':').map(Number);
                    const durationMinutes = (endHour * 60 + endMinute) - (hour * 60 + minute);
                    height = Math.max(24, (durationMinutes * 64) / 60); // minimum 24px height
                  }
                  
                  const colors = {
                    high: 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300',
                    medium: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300',
                    low: 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300',
                  };

                  const categoryColors = {
                    work: 'border-green-500',
                    personal: 'border-yellow-500',
                    health: 'border-red-500',
                    family: 'border-purple-500'
                  };

                  return (
                    <div
                      key={`${task.id}-${dayIndex}`}
                      className={`absolute rounded-lg p-2 m-1 border-l-4 cursor-pointer hover:shadow-md transition-shadow group ${colors[task.priority]} ${categoryColors[task.category]}`}
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
                          handleDeleteTask(task.id);
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-opacity"
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