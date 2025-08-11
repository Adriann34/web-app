import React, { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';

function TestPage() {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, message]);
  };

  const testBasicFirestore = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const testData = {
        test: 'Hello Firestore!',
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'test'), testData);
      addLog('SUCCESS: Basic Firestore test passed');
      addLog('Document ID: ' + docRef.id);
    } catch (error: any) {
      addLog('ERROR: ' + error.message);
    }
    setLoading(false);
  };

  const testUserEvents = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const eventData = {
        title: 'Test Event',
        date: '2025-08-15',
        startTime: '10:00',
        endTime: '11:00',
        category: 'work',
        priority: 'medium',
        createdAt: new Date().toISOString()
      };

      const userEventsCollection = collection(db, 'users', currentUser.uid, 'events');
      const docRef = await addDoc(userEventsCollection, eventData);
      addLog('SUCCESS: User event created');
      addLog('Event ID: ' + docRef.id);
    } catch (error: any) {
      addLog('ERROR: ' + error.message);
    }
    setLoading(false);
  };

  if (!currentUser) {
    return (
      <div className="p-8">
        <h1 className="text-2xl mb-4">Test Page</h1>
        <p>Please log in first</p>
        <a href="/login" className="text-blue-500">Go to Login</a>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Firestore Test Page</h1>
      
      <div className="mb-4">
        <p>User: {currentUser.email}</p>
      </div>

      <div className="space-x-4 mb-8">
        <button
          onClick={testBasicFirestore}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Basic
        </button>
        
        <button
          onClick={testUserEvents}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test User Events
        </button>

        <a href="/calendar" className="bg-gray-500 text-white px-4 py-2 rounded inline-block">
          Back to Calendar
        </a>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Test Results:</h3>
        {testResults.map((result, index) => (
          <div key={index}>{result}</div>
        ))}
      </div>
    </div>
  );
}

export default TestPage;