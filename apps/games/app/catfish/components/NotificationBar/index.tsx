"use client";

import { useEffect, useState } from "react";
import "./NotificationBar.css";

export interface NotificationBarProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  onDismiss: () => void;
  isExiting?: boolean;
}

export function NotificationBar({
  text,
  bgColor = "bg-owl-green",
  textColor = "text-white",
  onDismiss,
  isExiting = false,
}: NotificationBarProps) {
  const [animationClass, setAnimationClass] = useState(
    "notification-bar-enter",
  );

  useEffect(() => {
    if (isExiting) {
      setAnimationClass("notification-bar-exit");
    }
  }, [isExiting]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 text-center p-4 ${bgColor} ${animationClass} z-50`}
    >
      <img
        src="/images/catfish/divider/notification-bar-xxl.png"
        alt=""
        className="hidden xl:block 2xl:hidden w-full absolute bottom-[-2px] left-0 right-0"
      />
      <img
        src="/images/catfish/divider/notification-bar-xl.png"
        alt=""
        className="hidden lg:block xl:hidden w-full absolute bottom-[-2px] left-0 right-0"
      />
      <img
        src="/images/catfish/divider/notification-bar-lg.png"
        alt=""
        className="hidden md:block lg:hidden w-full absolute bottom-[-2px] left-0 right-0"
      />
      <img
        src="/images/catfish/divider/notification-bar-md.png"
        alt=""
        className="hidden sm:block md:hidden w-full absolute bottom-[-2px] left-0 right-0"
      />
      <img
        src="/images/catfish/divider/notification-bar-sm.png"
        alt=""
        className="block sm:hidden w-full absolute bottom-[-2px] left-0 right-0"
      />
      <div className="relative z-10 flex items-center justify-center">
        <p className={`${textColor} font-bold flex-1`}>{text}</p>
        <button
          onClick={onDismiss}
          className={`${textColor} hover:opacity-70 transition-opacity ml-4 text-xl font-bold`}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
