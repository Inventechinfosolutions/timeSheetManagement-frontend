import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  overlayClassName?: string;
  closeBtnClassName?: string;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "lg",
  className = "",
  overlayClassName = "",
  closeBtnClassName = "",
  closeOnBackdrop = true,
  closeOnEsc = true,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // Prevent body scroll and blur surrounding layout when modal is active
  useEffect(() => {
    if (open && !isClosing) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open-active");
    } else {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open-active");
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open-active");
    };
  }, [open, isClosing]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !isClosing && closeOnEsc) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isClosing, closeOnEsc]);

  if (!open || typeof document === "undefined") return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-scrollbar"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* Backdrop */}
      <div
        onClick={() => closeOnBackdrop && !isClosing && handleClose()}
        className={`fixed inset-0 z-0 bg-[#2B3674]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 ${
          isClosing ? "modal-overlay-is-closing" : ""
        } ${overlayClassName}`}
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative z-20 w-full ${maxWidthClasses[maxWidth]} bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200 ${
          isClosing ? "modal-is-closing" : ""
        } ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          {title ? (
            <h3 className="text-lg font-black text-[#2B3674] tracking-tight">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={handleClose}
            className={`p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer modal-close-btn ${closeBtnClassName}`}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="text-xs sm:text-sm text-gray-600">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 pt-4 mt-6 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
