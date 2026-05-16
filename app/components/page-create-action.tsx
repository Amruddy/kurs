"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

type PageCreateActionProps = {
  buttonLabel: string;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function PageCreateAction({ buttonLabel, title, defaultOpen = false, children }: PageCreateActionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <div className="page-create-action">
      <button className="button" type="button" onClick={() => setIsOpen(true)}>
        {buttonLabel}
      </button>
      {isOpen ? (
        <div className="page-create-backdrop" onClick={() => setIsOpen(false)}>
          <section
            className="page-create-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="page-create-overlay-header">
              <h2 id={titleId}>{title}</h2>
              <button className="secondary-button compact-button" type="button" onClick={() => setIsOpen(false)}>
                Закрыть
              </button>
            </div>
            {children}
          </section>
        </div>
      ) : null}
    </div>
  );
}
