'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  className?: string;
}

export function CodeEditor({ value, onChange, language, className }: CodeEditorProps) {
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  useEffect(() => {
    const lines = value.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [value]);

  return (
    <div className={cn('relative flex h-full overflow-hidden rounded-lg border bg-card', className)}>
      <div className="flex-shrink-0 select-none border-r bg-muted/30 px-3 py-4 text-right font-mono text-sm text-muted-foreground">
        {lineNumbers.map((num) => (
          <div key={num} className="leading-6">
            {num}
          </div>
        ))}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full resize-none rounded-none border-0 font-mono text-sm leading-6 focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder={`Write your ${language.toUpperCase()} code here...`}
        spellCheck={false}
      />
    </div>
  );
}
