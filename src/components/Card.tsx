import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white border border-diamond-lightGray rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}
