import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDestructive?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmDestructive = false,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="pointer-events-auto w-full max-w-sm sm:max-w-md flex flex-col"
              style={{ maxHeight: "90dvh" }}
            >
              <div
                className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                style={{ maxHeight: "90dvh", paddingBottom: "env(safe-area-inset-bottom)" }}
              >
                {/* Header — always visible */}
                <div className="flex justify-between items-center px-5 pt-5 pb-3 shrink-0">
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                    data-testid="button-close-modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto px-5 flex-1">
                  {children}
                </div>

                {/* Footer buttons — always visible, never clipped */}
                <div className="flex justify-end gap-3 px-5 py-4 shrink-0 border-t border-border/60">
                  <Button variant="secondary" onClick={onClose} data-testid="button-modal-cancel">
                    {cancelLabel}
                  </Button>
                  {onConfirm && (
                    confirmDestructive ? (
                      <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-2 text-sm font-medium transition-colors"
                        data-testid="button-modal-confirm"
                      >
                        {confirmLabel}
                      </button>
                    ) : (
                      <Button onClick={onConfirm} data-testid="button-modal-confirm">
                        {confirmLabel}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
