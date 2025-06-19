import React from 'react';
import styles from './Logout.module.scss';
import { LogoutIcon } from 'renderer/icons';
import { useAuth } from 'renderer/context/AuthContext';

export default function Logout() {
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        // The app will automatically redirect to login screen via AuthContext
        console.log('Successfully logged out');
      } else {
        console.error('Logout failed:', result.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Only show logout button if user is authenticated
  if (!user) {
    return null;
  }

  return (
    <button className={styles.iconHolder} onClick={handleLogout} title="Sign out">
      <LogoutIcon className={styles.logoutIcon} />
    </button>
  );
}
