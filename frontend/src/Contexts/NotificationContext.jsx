import React, { createContext, useContext, useState } from 'react';
import Notification from '../Components/Notification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ notification, setNotification }}>
      {children}
      {notification && (
        <Notification message="Your requested PDF has been generated!" onClose={hideNotification}></Notification>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
