import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("w-full py-4 border-t bg-gray-50", className)}>
      <div className="container mx-auto px-4 flex flex-col items-center justify-center">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Powered by</p>
          <a 
            href="https://www.diamondai.tech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <span className="font-bold text-primary">Diamond</span>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">AI</span>
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-1">© {new Date().getFullYear()} DiamondAI. All rights reserved.</p>
      </div>
    </footer>
  );
} 