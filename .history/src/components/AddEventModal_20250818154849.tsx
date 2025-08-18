import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TaskFormData, Task } from '../utils/types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  editingTask?: Task | null;
  selectedDate?: string;
}

function AddEventModal({ isOpen, onClose, onSave, editingTask, selectedDate }: AddEventModalProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getInitialFormData = (): TaskFormData => ({
    title: '',
    description: '',
    date: selectedDate || new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    allDay: false,
    priority: 'medium',
    category: 'work',
    location: '',
    reminders: [15],
    recurring: {
      type: 'none',
      interval: 1,
      endDate: ''
    }
  });

  const [formData, setFormData] = useState<TaskFormData>(getInitialFormData);
  const [activeTab, setActiveTab] = useState<'details' | 'reminders' | 'recurring'>('details');
  const [errors, setErrors] = useState<Partial<TaskFormData>>({});

  // Update URL when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(searchParams);
      params.set('modal', 'add-event');
      if (selectedDate) params.set('date', selectedDate);
      if (editingTask) params.set('edit', editingTask.id);
      setSearchParams(params);
    } else {
      const params = new URLSearchParams(searchParams);
      params.delete('modal');
      params.delete('date');
      params.delete('edit');
      setSearchParams(params);
    }
  }, [isOpen, selectedDate, editingTask, searchParams, setSearchParams]);

  // Handle form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        // Populate form when editing
        setFormData({
          title: editingTask.title,
          description: editingTask.description || '',
          date: editingTask.date,
          startTime: editingTask.startTime || '09:00',
          endTime: editingTask.endTime || '10:00',
          allDay: editingTask.allDay,
          priority: editingTask.priority,
          category: editingTask.category,
          location: editingTask.location || '',
          reminders: editingTask.reminders || [15],
          recurring: {
            type: editingTask.recurring?.type || 'none',
            interval: editingTask.recurring?.interval || 1,
            endDate: editingTask.recurring?.endDate || ''
          }
        });
      } else {
        // For new events, always start with clean slate
        const initialData = getInitialFormData();
        // Update the date if selectedDate is provided
        if (selectedDate) {
          initialData.date = selectedDate;
        }
        setFormData(initialData);
      }
      // Reset to details tab when opening
      setActiveTab('details');
      // Clear any errors
      setErrors({});
    }
  }, [isOpen, editingTask, selectedDate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<TaskFormData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.allDay && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const now = new Date().toISOString();
    const task: Task = {
      id: editingTask?.id || `task_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      startTime: formData.allDay ? undefined : formData.startTime,
      endTime: formData.allDay ? undefined : formData.endTime,
      allDay: formData.allDay,
      completed: editingTask?.completed || false,
      priority: formData.priority,
      category: formData.category,
      location: formData.location,
      reminders: formData.reminders,
      recurring: {
        type: formData.recurring.type,
        interval: formData.recurring.interval,
        endDate: formData.recurring.endDate || undefined
      },
      createdAt: editingTask?.createdAt || now,
      updatedAt: now
    };

    console.log('AddEventModal: Submitting task:', task);
    onSave(task);
    
    // Reset form to clean slate after successful save
    setFormData(getInitialFormData());
    setActiveTab('details');
    setErrors({});
    
    onClose();
  };

  const handleClose = () => {
    onClose();
    navigate('/calendar', { replace: true });
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
            { id: 'recurring', label: 'Recurring', icon: '🔄' }
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
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter event title..."
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
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add a description..."
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.allDay}
                        onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">All Day</span>
                    </label>
                  </div>
                </div>

                {/* Time Fields */}
                {!formData.allDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
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
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
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
                        formData.category === 'work' ? 'bg-green-500' :
                        formData.category === 'personal' ? 'bg-yellow-500' :
                        formData.category === 'health' ? 'bg-red-500' :
                        'bg-purple-500'
                      }`}></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.category === 'work' ? 'Work' :
                         formData.category === 'personal' ? 'Personal' :
                         formData.category === 'health' ? 'Health' :
                         'Family Events'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    {/* Priority Preview */}
                    <div className="mt-2 flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        formData.priority === 'high' ? 'bg-red-500' :
                        formData.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.priority === 'high' ? 'High Priority' :
                         formData.priority === 'medium' ? 'Medium Priority' :
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
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
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
                        checked={formData.reminders.includes(minutes)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              reminders: [...prev.reminders, minutes]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              reminders: prev.reminders.filter(r => r !== minutes)
                            }));
                          }
                        }}
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

            {/* Recurring Tab */}
            {activeTab === 'recurring' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recurring Event</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repeat
                  </label>
                  <select
                    value={formData.recurring.type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recurring: { ...prev.recurring, type: e.target.value as any }
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {formData.recurring.type !== 'none' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Repeat Every
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={formData.recurring.interval}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            recurring: { ...prev.recurring, interval: parseInt(e.target.value) || 1 }
                          }))}
                          className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          {formData.recurring.type === 'daily' && 'day(s)'}
                          {formData.recurring.type === 'weekly' && 'week(s)'}
                          {formData.recurring.type === 'monthly' && 'month(s)'}
                          {formData.recurring.type === 'yearly' && 'year(s)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.recurring.endDate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recurring: { ...prev.recurring, endDate: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              {editingTask ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEventModal;