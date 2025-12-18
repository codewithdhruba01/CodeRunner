"use client";

import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  className?: string;
}

// Comment patterns for different languages
const commentPatterns = {
  python: {
    singleLine: /#.*$/gm,
    multiLine: null, // Python doesn't have multi-line comments
  },
  c: {
    singleLine: /\/\/.*$/gm,
    multiLine: /\/\*[\s\S]*?\*\//g,
  },
  cpp: {
    singleLine: /\/\/.*$/gm,
    multiLine: /\/\*[\s\S]*?\*\//g,
  },
  java: {
    singleLine: /\/\/.*$/gm,
    multiLine: /\/\*[\s\S]*?\*\//g,
  },
};

function SyntaxHighlighter({ code, language }: { code: string; language: string }) {
  const patterns = commentPatterns[language as keyof typeof commentPatterns];

  if (!patterns) {
    // If language not supported, return plain text
    return <span>{code}</span>;
  }

  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  const allMatches: Array<{ start: number; end: number; type: 'single' | 'multi' }> = [];

  // Collect all comment matches
  if (patterns.singleLine) {
    const regex = new RegExp(patterns.singleLine);
    let match;
    while ((match = regex.exec(code)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'single'
      });
      // Prevent infinite loop on zero-length matches
      if (match[0].length === 0) break;
    }
  }

  if (patterns.multiLine) {
    const regex = new RegExp(patterns.multiLine);
    let match;
    while ((match = regex.exec(code)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'multi'
      });
      // Prevent infinite loop on zero-length matches
      if (match[0].length === 0) break;
    }
  }

  // Sort matches by start position
  allMatches.sort((a, b) => a.start - b.start);

  // Process matches and create highlighted elements
  allMatches.forEach((match, index) => {
    // Add non-comment text before this match
    if (match.start > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {code.slice(lastIndex, match.start)}
        </span>
      );
    }

    // Add highlighted comment
    parts.push(
      <span
        key={`comment-${index}`}
        className="text-green-600 dark:text-green-400 italic"
      >
        {code.slice(match.start, match.end)}
      </span>
    );

    lastIndex = match.end;
  });

  // Add remaining non-comment text
  if (lastIndex < code.length) {
    parts.push(
      <span key="text-final">
        {code.slice(lastIndex)}
      </span>
    );
  }

  return <>{parts.length > 0 ? parts : <span>{code}</span>}</>;
}

export function CodeEditor({
  value,
  onChange,
  language,
  className,
}: CodeEditorProps) {
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lines = value.split("\n").length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [value]);

  // Sync scroll position between textarea and highlighter
  useEffect(() => {
    const textarea = textareaRef.current;
    const highlighter = highlighterRef.current;

    if (!textarea || !highlighter) return;

    const syncScroll = () => {
      highlighter.scrollTop = textarea.scrollTop;
      highlighter.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, []);

  return (
    <div
      className={cn(
        "relative flex h-full overflow-hidden rounded-lg border bg-card",
        className
      )}
    >
      {/* Line Numbers */}
      <div className="flex-shrink-0 select-none border-r bg-muted/30 px-3 py-4 text-right font-mono text-sm text-muted-foreground">
        {lineNumbers.map((num) => (
          <div key={num} className="leading-6">
            {num}
          </div>
        ))}
      </div>

      {/* Code Editor Container */}
      <div className="relative flex-1 overflow-hidden">
        {/* Hidden Textarea for Input */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full resize-none rounded-none border-0 bg-transparent font-mono text-sm leading-6 focus-visible:ring-0 focus-visible:ring-offset-0 text-transparent caret-black dark:caret-white z-10"
          placeholder={`Write your ${language.toUpperCase()} code here...`}
          spellCheck={false}
          style={{
            color: 'transparent',
            background: 'transparent',
            caretColor: 'currentColor',
            padding: '1rem',
            paddingRight: '1rem',
          }}
        />

        {/* Syntax Highlighted Display */}
        <div
          ref={highlighterRef}
          className="absolute inset-0 h-full overflow-auto rounded-none border-0 bg-transparent font-mono text-sm leading-6 pointer-events-none whitespace-pre-wrap break-words"
          style={{
            padding: '1rem',
            lineHeight: '1.5rem',
          }}
        >
          <SyntaxHighlighter code={value} language={language} />
        </div>
      </div>
    </div>
  );
}
