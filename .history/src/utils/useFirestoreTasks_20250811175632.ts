import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { Task } from './types';

export function useFirestoreTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Real-time listener for user's tasks
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const tasksCollection = collection(db, 'users', currentUser.uid, 'events');
    const tasksQuery = query(tasksCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(tasksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Add new task to Firestore
  const addTask = async (taskData: Omit<Task, 'id'>) => {
    if (!currentUser) return;

    try {
      const tasksCollection = collection(db, 'users', currentUser.uid, 'events');
      await addDoc(tasksCollection, taskData);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  // Update existing task
  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    if (!currentUser) return;

    try {
      const taskDoc = doc(db, 'users', currentUser.uid, 'events', taskId);
      await updateDoc(taskDoc, taskData);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!currentUser) return;

    try {
      const taskDoc = doc(db, 'users', currentUser.uid, 'events', taskId);
      await deleteDoc(taskDoc);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  // Save task (add or update)
  const saveTask = async (task: Task) => {
    if (!currentUser) return;

    const { id, ...taskData } = task;
    
    if (id && id.startsWith('task_')) {
      // New task (temporary ID)
      await addTask(taskData);
    } else if (id) {
      // Existing task
      await updateTask(id, taskData);
    } else {
      // New task without ID
      await addTask(taskData);
    }
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    saveTask
  };
}