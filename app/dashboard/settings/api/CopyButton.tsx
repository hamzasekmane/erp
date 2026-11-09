'use client';

import { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors"
      title="Copier"
    >
      {copied ? (
        <CheckCircle size={16} className="text-emerald-500" />
      ) : (
        <Copy size={16} className="text-emerald-500" />
      )}
    </button>
  );
}