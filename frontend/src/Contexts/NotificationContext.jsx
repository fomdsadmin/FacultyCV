import React, { createContext, useContext, useState } from 'react';
import { toast } from "react-toastify";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = ({ message, type = 'success' }) => {
    switch (type) {
      case 'success':
        toast.success(message, {
          autoClose: 4000,
          theme: "light",
        });
        break;
      case 'error':
        toast.error(message, {
          autoClose: 4000,
          theme: "light",
        });
        break;
      case 'info':
        toast.info(message, {
          autoClose: 4000,
          theme: "light",
        });
        break;
      case 'warning':
        toast.warning(message, {
          autoClose: 4000,
          theme: "light",
        });
        break;
      default:
        toast(message, {
          autoClose: 4000,
          theme: "light",
        });
    }
  };

  // Override setNotification to use toast instead
  const setNotificationWithToast = (notificationData) => {
    if (notificationData) {
      showNotification(notificationData);
    }
    setNotification(notificationData);
  };

  return (
    <NotificationContext.Provider value={{ notification, setNotification: setNotificationWithToast }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
