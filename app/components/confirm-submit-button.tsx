"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  confirmLabel?: string;
  message: string;
};

export function ConfirmSubmitButton({
  children,
  className,
  confirmLabel = "Точно",
  message,
}: ConfirmSubmitButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <span className="confirm-submit-control">
        <button
          className={`danger-button compact-button confirm-submit-button${
            className?.includes("icon-button") ? " icon-button" : ""
          }`}
          type="submit"
          title={message}
        >
          {children}
        </button>
        <span className="confirm-submit-hint">{confirmLabel}</span>
      </span>
    );
  }

  return (
    <button
      className={className}
      type="button"
      onClick={() => {
        setIsConfirming(true);
      }}
    >
      {children}
    </button>
  );
}
