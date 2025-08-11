import React from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';

function FirestoreTest() {
  const { currentUser } = useAuth();

  const testFirestore = async () => {
    if (!currentUser) {
      alert('Please log in first');
      return;
    }

    try {
      const testData = {
        test: 'Hello Firestore!',
        timestamp: new Date().toISOString(),
        userId: currentUser.uid
      };

      const docRef = await addDoc(collection(db, 'test'), testData);
      alert(`Test document added with ID: ${docRef.id}`);
      console.log('Test document written with ID: ', docRef.id);
    } catch (error) {
      console.error('Error adding test document: ', error);
      alert('Error: ' + error);
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={testFirestore}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Test Firestore Connection
      </button>
    </div>
  );
}

export default FirestoreTest;