'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// Context
interface ModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal 컴포넌트는 Modal.Root 내부에서 사용해야 합니다');
  }
  return context;
}

// Root
interface RootProps {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Root({ children, defaultOpen = false, open, onOpenChange }: RootProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpen = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(true);
    } else {
      setInternalOpen(true);
    }
  }, [isControlled, onOpenChange]);

  const handleClose = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalOpen(false);
    }
  }, [isControlled, onOpenChange]);

  return (
    <ModalContext.Provider value={{ isOpen, open: handleOpen, close: handleClose }}>
      {children}
    </ModalContext.Provider>
  );
}

// Trigger
interface TriggerProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

function Trigger({ children, className, asChild }: TriggerProps) {
  const { open } = useModalContext();

  if (asChild) {
    return <span onClick={open}>{children}</span>;
  }

  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}

// Content
interface ContentProps {
  children: ReactNode;
  className?: string;
}

function Content({ children, className }: ContentProps) {
  const { isOpen } = useModalContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ${className || ''}`}
      >
        {children}
      </div>
    </div>
  );
}

// Header
interface HeaderProps {
  children: ReactNode;
  className?: string;
}

function Header({ children, className }: HeaderProps) {
  return (
    <h2 className={`mb-4 text-xl font-bold text-gray-900 ${className || ''}`}>
      {children}
    </h2>
  );
}

// Body
interface BodyProps {
  children: ReactNode;
  className?: string;
}

function Body({ children, className }: BodyProps) {
  return <div className={className}>{children}</div>;
}

// Close
interface CloseProps {
  children: ReactNode;
  className?: string;
}

function Close({ children, className }: CloseProps) {
  const { close } = useModalContext();

  return (
    <button type="button" onClick={close} className={className}>
      {children}
    </button>
  );
}

// Hook for programmatic control
function useModal() {
  return useModalContext();
}

export const Modal = {
  Root,
  Trigger,
  Content,
  Header,
  Body,
  Close,
  useModal,
};
