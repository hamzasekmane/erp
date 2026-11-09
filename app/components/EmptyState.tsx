"use client";

import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 opacity-40">
      <AlertCircle size={24} className="mb-2" />
      <p className="text-[9px] font-black uppercase italic tracking-widest">{message}</p>
    </div>
  );
}