import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
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

    console.log('Setting up Firestore listener for user:', currentUser.uid);
    const tasksCollection = collection(db, 'users', currentUser.uid, 'events');
    const tasksQuery = query(tasksCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(tasksQuery,
      (snapshot) => {
        const tasksData: Task[] = [];
        snapshot.forEach((doc) => {
          tasksData.push({ id: doc.id, ...doc.data() } as Task);
          });
       console.log('Loaded tasks from Firestore:', tasksData);
       setTasks(tasksData);
       setLoading(false);
     },
     (error) => {
       console.error('Error listening to tasks:', error);
       setLoading(false);
     }
   );

   return () => unsubscribe();
 }, [currentUser]);

 // Add new task to Firestore
 const addTask = async (taskData: Omit<Task, 'id'>) => {
   if (!currentUser) {
     console.log('No current user, cannot add task');
     return;
   }

   try {
     console.log('Adding task to Firestore:', taskData);
     const tasksCollection = collection(db, 'users', currentUser.uid, 'events');
     const docRef = await addDoc(tasksCollection, {
       ...taskData,
       // Ensure all required fields are included
       title: taskData.title,
       description: taskData.description || '',
       date: taskData.date,
       startTime: taskData.startTime,
       endTime: taskData.endTime,
       allDay: taskData.allDay,
       completed: taskData.completed || false,
       priority: taskData.priority,
       category: taskData.category,
       location: taskData.location || '',
       reminders: taskData.reminders || [],
       recurring: taskData.recurring || { type: 'none', interval: 1 },
       createdAt: taskData.createdAt,
       updatedAt: taskData.updatedAt
     });
     console.log('Task added with ID:', docRef.id);
   } catch (error) {
     console.error('Error adding task:', error);
     throw error;
   }
 };

 // Update existing task
 const updateTask = async (taskId: string, taskData: Partial<Task>) => {
   if (!currentUser) return;

   try {
     console.log('Updating task:', taskId, taskData);
     const taskDoc = doc(db, 'users', currentUser.uid, 'events', taskId);
     await updateDoc(taskDoc, taskData);
     console.log('Task updated successfully');
   } catch (error) {
     console.error('Error updating task:', error);
     throw error;
   }
 };

 // Delete task
 const deleteTask = async (taskId: string) => {
   if (!currentUser) return;

   try {
     console.log('Deleting task:', taskId);
     const taskDoc = doc(db, 'users', currentUser.uid, 'events', taskId);
     await deleteDoc(taskDoc);
     console.log('Task deleted successfully');
   } catch (error) {
     console.error('Error deleting task:', error);
     throw error;
   }
 };

 // Save task (add or update) - FIXED VERSION
 const saveTask = async (task: Task) => {
   if (!currentUser) {
     console.log('No current user, cannot save task');
     return;
   }

   try {
     // If it's a new task (no ID or temporary ID starting with 'task_')
     if (!task.id || task.id.startsWith('task_')) {
       console.log('Adding new task');
       // Create a clean task object without the temporary ID
       const { id, ...taskDataWithoutId } = task;
       await addTask(taskDataWithoutId);
     } else {
       // Existing task with real Firestore ID
       console.log('Updating existing task');
       const { id, ...taskData } = task;
       await updateTask(id, taskData);
     }
   } catch (error) {
     console.error('Error in saveTask:', error);
     throw error;
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