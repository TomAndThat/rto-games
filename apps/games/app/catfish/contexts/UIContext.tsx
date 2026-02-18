"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { NotificationBar } from "../components/NotificationBar";

interface NotificationOptions {
  text: string;
  bgColor?: string;
  textColor?: string;
  duration?: number;
}

interface UIContextValue {
  showNotification: (options: NotificationOptions) => void;
  hideNotification: () => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationOptions | null>(
    null,
  );
  const [isExiting, setIsExiting] = useState(false);

  const hideNotification = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation to complete before removing
    setTimeout(() => {
      setNotification(null);
      setIsExiting(false);
    }, 300); // Match animation duration
  }, []);

  const showNotification = useCallback(
    (options: NotificationOptions) => {
      // If there's an existing notification, hide it first
      if (notification) {
        hideNotification();
        // Wait for exit animation before showing new one
        setTimeout(() => {
          setNotification(options);
        }, 300);
      } else {
        setNotification(options);
      }
    },
    [notification, hideNotification],
  );

  // Auto-dismiss after duration
  useEffect(() => {
    if (notification && !isExiting) {
      const duration = notification.duration ?? 5000;
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification, isExiting, hideNotification]);

  return (
    <UIContext.Provider value={{ showNotification, hideNotification }}>
      {notification && (
        <NotificationBar
          text={notification.text}
          bgColor={notification.bgColor}
          textColor={notification.textColor}
          onDismiss={hideNotification}
          isExiting={isExiting}
        />
      )}
      {children}
    </UIContext.Provider>
  );
}

export function useCatfishUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useCatfishUI must be used within a UIProvider");
  }
  return context;
}
