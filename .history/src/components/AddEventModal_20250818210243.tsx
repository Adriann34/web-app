import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';
import { Task } from '../utils/types';
import toast from 'react-hot-toast';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  editingTask?: Task | null;
  selectedDate?: string;
  selectedTime?: string;
}

function AddEventModal({ isOpen, onClose, editingTask, selectedDate, selectedTime }: AddEventModalProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState<'work' | 'personal' | 'health' | 'family'>('work');
  const [location, setLocation] = useState('');
  const [reminders, setReminders] = useState<number[]>([15]);
  
  const [activeTab, setActiveTab] = useState<'details' | 'reminders' | 'recurring'>('details');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);

  // FIXED: Better date formatting helper
  const formatDateForInput = (dateInput?: string | Date) => {
    if (!dateInput) {
      return new Date().toISOString().split('T')[0];
    }
    
    // If it's already a string in YYYY-MM-DD format, return it
    if (typeof dateInput === 'string') {
      // Check if it's already in the correct format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      // Try to parse the string as a date
      const parsedDate = new Date(dateInput);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
      return dateInput; // Return as-is if we can't parse it
    }
    
    // If it's a Date object
    if (dateInput instanceof Date) {
      return dateInput.toISOString().split('T')[0];
    }
    
    // Fallback
    return new Date().toISOString().split('T')[0];
  };

  // FIXED: Better time calculation helper
  const calculateEndTime = (startTimeStr: string) => {
    const [hour, minute] = startTimeStr.split(':').map(Number);
    const endHour = (hour + 1) % 24; // Handle wrap around for 23:00 -> 00:00
    return `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Reset form when modal opens/closes or when editing task changes
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened. Editing task:', editingTask);
      console.log('Selected date:', selectedDate);
      console.log('Selected time:', selectedTime);
      
      if (editingTask) {
        // Populate form when editing
        setTitle(editingTask.title);
        setDescription(editingTask.description || '');
        setDate(formatDateForInput(editingTask.date));
        setStartTime(editingTask.startTime || '09:00');
        setEndTime(editingTask.endTime || '10:00');
        setAllDay(editingTask.allDay);
        setPriority(editingTask.priority);
        setCategory(editingTask.category);
        setLocation(editingTask.location || '');
        setReminders(editingTask.reminders || [15]);
      } else {
        // Reset form for new event with autofill
        setTitle('');
        setDescription('');
        
        // FIXED: Use selected date or current date
        const defaultDate = formatDateForInput(selectedDate);
        setDate(defaultDate);
        
        // FIXED: Use selected time or default time
        if (selectedTime) {
          setStartTime(selectedTime);
          setEndTime(calculateEndTime(selectedTime));
          setAllDay(false); // If time is selected, it's not all day
        } else {
          setStartTime('09:00');
          setEndTime('10:00');
          setAllDay(false);
        }
        
        setPriority('medium');
        setCategory('work');
        setLocation('');
        setReminders([15]);
      }
      
      // Reset to details tab and clear errors
      setActiveTab('details');
      setErrors({});
    }
  }, [isOpen, editingTask, selectedDate, selectedTime]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!allDay && startTime >= endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Current user:', currentUser);
    console.log('Form validation...');
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      toast.error('Please fix the form errors and try again');
      return;
    }

    if (!currentUser) {
      toast.error('You must be logged in to save events');
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading(editingTask ? 'Updating event...' : 'Creating event...');
    
    try {
      console.log('Preparing task data...');
      
      // Create the task object properly with conditional properties
      const taskData: any = {
        title: title.trim(),
        description: description.trim(),
        date: date,
        allDay: allDay,
        completed: false,
        priority: priority,
        category: category,
        location: location.trim(),
        reminders: reminders,
        recurring: {
          type: 'none',
          interval: 1
        }
      };

      // Only add time fields if not all day
      if (!allDay) {
        taskData.startTime = startTime;
        taskData.endTime = endTime;
      }

      console.log('Task data prepared:', taskData);

      const userEventsCollection = collection(db, 'users', currentUser.uid, 'events');
      console.log('Collection reference created');

      if (editingTask && editingTask.id) {
        // Update existing task
        console.log('Updating existing task with ID:', editingTask.id);
        const taskDoc = doc(db, 'users', currentUser.uid, 'events', editingTask.id);
        
        const updateData = {
          ...taskData,
          updatedAt: new Date().toISOString()
        };
        
        console.log('Updating with data:', updateData);
        await updateDoc(taskDoc, updateData);
        console.log('Task updated successfully!');
        toast.dismiss(loadingToast);
        toast.success('Event updated successfully!');
      } else {
        // Create new task
        console.log('Creating new task...');
        
        const createData = {
          ...taskData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('Creating with data:', createData);
        const docRef = await addDoc(userEventsCollection, createData);
        console.log('New task created with ID:', docRef.id);
        toast.dismiss(loadingToast);
        toast.success('Event created successfully!');
      }

      // Reset form and close modal
      console.log('Resetting form and closing modal...');
      setTitle('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
      setAllDay(false);
      setPriority('medium');
      setCategory('work');
      setLocation('');
      setReminders([15]);
      setActiveTab('details');
      setErrors({});
      
      onClose();
      
    } catch (error: any) {
      console.error('=== ERROR SAVING TASK ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      toast.dismiss(loadingToast);
      toast.error(`Error saving event: ${error.message}`);
    } finally {
      setSaving(false);
      console.log('=== FORM SUBMISSION ENDED ===');
    }
  };

  const handleClose = () => {
    console.log('Closing modal...');
    onClose();
  };

  const handleReminderChange = (minutes: number, checked: boolean) => {
    if (checked) {
      setReminders(prev => [...prev, minutes].sort((a, b) => a - b));
    } else {
      setReminders(prev => prev.filter(r => r !== minutes));
    }
  };

  // FIXED: Update end time when start time changes
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    // Auto-update end time to be 1 hour later if it's currently before or equal to start time
    if (endTime <= newStartTime) {
      setEndTime(calculateEndTime(newStartTime));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingTask ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-gray-500 dark:text-gray-400 text-xl">×</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {[
            { id: 'details', label: 'Details', icon: '📝' },
            { id: 'reminders', label: 'Reminders', icon: '🔔' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter event title..."
                    autoFocus
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add a description..."
                  />
                </div>

                {/* Date and All Day */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={allDay}
                        onChange={(e) => setAllDay(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">All Day</span>
                    </label>
                  </div>
                </div>

                {/* Time Fields */}
                {!allDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                          errors.endTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.endTime && (
                        <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Category and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="health">Health</option>
                      <option value="family">Family Events</option>
                    </select>
                    {/* Category Preview */}
                    <div className="mt-2 flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        category === 'work' ? 'bg-green-500' :
                        category === 'personal' ? 'bg-yellow-500' :
                        category === 'health' ? 'bg-red-500' :
                        'bg-purple-500'
                      }`}></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {category === 'work' ? 'Work' :
                         category === 'personal' ? 'Personal' :
                         category === 'health' ? 'Health' :
                         'Family Events'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    {/* Priority Preview */}
                    <div className="mt-2 flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        priority === 'high' ? 'bg-red-500' :
                        priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {priority === 'high' ? 'High Priority' :
                         priority === 'medium' ? 'Medium Priority' :
                         'Low Priority'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add location..."
                  />
                </div>
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === 'reminders' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Set Reminders</h3>
                <div className="space-y-3">
                  {[5, 15, 30, 60, 1440].map((minutes) => (
                    <label key={minutes} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={reminders.includes(minutes)}
                        onChange={(e) => handleReminderChange(minutes, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        {minutes < 60 ? `${minutes} minutes before` : 
                         minutes === 60 ? '1 hour before' : '1 day before'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{editingTask ? 'Update Event' : 'Create Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEventModal;