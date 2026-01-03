'use client';

import { useEffect, type ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ open, onClose, children }: DrawerProps) {
  // 스크롤 방지
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* 드로워 */}
      <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl animate-slide-in">
        {children}
      </div>
    </div>
  );
}
