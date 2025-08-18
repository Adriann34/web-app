import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

function TasksPage() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Listen to tasks from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim() || !currentUser) return;

    setLoading(true);
    
    try {
      const tasksCollection = collection(db, 'users', currentUser.uid, 'tasks');
      await addDoc(tasksCollection, {
        title: newTaskTitle.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      setNewTaskTitle('');
      toast.success('Task added!');
    } catch (error: any) {
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
      
      toast.success(!completed ? 'Task completed!' : 'Task uncompleted!');
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  if (!currentUser) {
    return <div>Please log in to view tasks.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter new task..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newTaskTitle.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </form>

      {/* Toggle View */}
      <div className="mb-4">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-blue-600 hover:underline"
        >
          {showCompleted ? 'Show Active Tasks' : 'Show Completed Tasks (History)'}
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {showCompleted ? (
          <>
            <h2 className="text-lg font-semibold text-gray-600">Completed Tasks ({completedTasks.length})</h2>
            {completedTasks.length === 0 ? (
              <p className="text-gray-500">No completed tasks yet.</p>
            ) : (
              completedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id, task.completed)}
                    className="w-4 h-4"
                  />
                  <span className="flex-1 line-through text-gray-500">{task.title}</span>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Active Tasks ({pendingTasks.length})</h2>
            {pendingTasks.length === 0 ? (
              <p className="text-gray-500">No active tasks. Add one above!</p>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id, task.completed)}
                    className="w-4 h-4"
                  />
                  <span className="flex-1">{task.title}</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TasksPage;