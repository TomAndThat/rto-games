"use client";

import { useState } from "react";

type ButtonVariant = "1" | "2" | "3" | "4";

type CatfishButtonProps = {
  variant: ButtonVariant;
  children: React.ReactNode;
  color: string;
  hoverColor: string;
  textColor?: string;
  onClick?: () => void;
};

const BUTTON_CONFIG = {
  "1": {
    frame: "/images/catfish/buttons/button-1-frame.png",
    viewBox: "0 0 286 74",
    path: "M15 0L0 1V10.5L1 42.5L0 70.5L93 73.5L172 71H208L238 73H252.5L284.5 72V50.5L285.5 41.5V3.5L280 2.5H252.5L223 1.5H205L165 0.5L139.5 3L114.5 1.5L79 0.5L53.5 1.5L15 0Z",
    imgClassName: "",
  },
  "2": {
    frame: "/images/catfish/buttons/button-2-frame.png",
    viewBox: "0 0 287 76",
    path: "M50 0L2 1.5L1 20.5L0 45L1 70L14.5 71.5L52.5 70H124.5L203.5 73.5L265.5 76L285.5 75V49.5L286.5 28.5V5.5H277L251 2.5L202 1.5L158 2.5L99.5 0H50Z",
    imgClassName: "",
  },
  "3": {
    frame: "/images/catfish/buttons/button-3-frame.png",
    viewBox: "0 0 283 66",
    path: "M66.5 4.09309e-08L-6.15502e-10 1L-3.81611e-08 62L96 65L165.5 66L282.5 66L282.5 3L220.5 3L154 9.47873e-08L66.5 4.09309e-08Z",
    imgClassName: "translate-y-[-4px] md:translate-y-[-6px]",
  },
  "4": {
    frame: "/images/catfish/buttons/button-4-frame.png",
    viewBox: "0 0 284 56",
    path: "M63.5 0H1L0 24.5V50.5L55 54H103L144 52.5H174.5H219L284 54L283 3L236.5 1.5H152.5L63.5 0Z",
    imgClassName: "translate-y-[-2px]",
  },
} as const;

export function CatfishButton({
  variant,
  children,
  color,
  hoverColor,
  textColor = "white",
  onClick,
}: CatfishButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = BUTTON_CONFIG[variant];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full cursor-pointer border-none bg-transparent p-0"
    >
      <img
        src={config.frame}
        alt=""
        className={`w-full h-auto relative z-10 ${config.imgClassName}`}
      />
      <svg
        className="absolute inset-0 w-full h-auto transition-colors duration-200"
        viewBox={config.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path d={config.path} fill={isHovered ? hoverColor : color} />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-heading lowercase text-xl sm:text-2xl ${parseInt(variant) < 4 ? "md:text-3xl" : ""} text-white z-20 pb-1 ${variant === "3" ? "mb-2" : ""}`}
        style={{ color: textColor }}
      >
        {children}
      </span>
    </button>
  );
}
