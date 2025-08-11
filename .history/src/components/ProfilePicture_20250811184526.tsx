import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { storage } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';

function ProfilePicture() {
  const { currentUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);
    try {
      // Create a reference to store the image
      const imageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
      
      // Upload the file
      await uploadBytes(imageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(imageRef);
      
      // Update user profile with new photo URL
      await updateProfile(currentUser, {
        photoURL: downloadURL
      });

      // Force a re-render by updating the auth state
      window.location.reload();
    } catch (error) {
      console.error('Error uploading image:', error);
    }
    setUploading(false);
  };

  const getInitials = () => {
    const name = currentUser?.displayName || currentUser?.email || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="relative">
      <div 
        className="w-12 h-12 rounded-full overflow-hidden cursor-pointer ring-2 ring-green-500 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium"
        onClick={() => fileInputRef.current?.click()}
      >
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
      
      {uploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}

export default ProfilePicture;