import React from 'react';
import { useAuth } from '../utils/AuthContext';

function ProfilePicture() {
  const { currentUser } = useAuth();

  const getInitials = () => {
    const name = currentUser?.displayName || currentUser?.email || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="relative">
      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-green-500 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
        {currentUser?.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm">{getInitials()}</span>
        )}
      </div>
      
      {/* Green online indicator */}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
    </div>
  );
}

export default ProfilePicture;