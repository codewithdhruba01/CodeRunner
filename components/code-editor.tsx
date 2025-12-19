"use client";

import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, FileText, Clock, Search, Replace } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  className?: string;
}

const commentPatterns = {
  python: {
    singleLine: /#.*$/gm,
    multiLine: null,
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

    return <span>{code}</span>;
  }

  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  const allMatches: Array<{ start: number; end: number; type: 'single' | 'multi' }> = [];


  if (patterns.singleLine) {
    const regex = new RegExp(patterns.singleLine);
    let match;
    while ((match = regex.exec(code)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'single'
      });

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

      if (match[0].length === 0) break;
    }
  }

  allMatches.sort((a, b) => a.start - b.start);

  allMatches.forEach((match, index) => {

    if (match.start > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {code.slice(lastIndex, match.start)}
        </span>
      );
    }

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
  const containerRef = useRef<HTMLDivElement>(null);

  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matches, setMatches] = useState<Array<{ start: number, end: number }>>([]);

  useEffect(() => {
    const lines = value.split("\n").length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [value]);

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

  const getIndentation = (text: string, position: number): string => {

    const beforeCursor = text.substring(0, position);
    const lines = beforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];


    const match = currentLine.match(/^(\s*)/);
    let indent = match ? match[1] : '';

    const openingBraces = ['{', '[', '('];
    const closingBraces = ['}', ']', ')'];

    const trimmedLine = currentLine.trim();
    if (openingBraces.some(bracket => trimmedLine.endsWith(bracket))) {
      indent += '  ';
    }

    if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']') || trimmedLine.startsWith(')')) {
      indent = indent.substring(0, Math.max(0, indent.length - 2));
    }

    return indent;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      if (e.shiftKey) {

        const lines = selectedText.split('\n');
        const unindentedLines = lines.map(line => {
          if (line.startsWith('  ')) return line.substring(2);
          if (line.startsWith('\t')) return line.substring(1);
          return line;
        });
        const newText = unindentedLines.join('\n');

        const beforeSelection = value.substring(0, start);
        const afterSelection = value.substring(end);
        const newValue = beforeSelection + newText + afterSelection;

        onChange(newValue);

        const newStart = start;
        const newEnd = end - (selectedText.length - newText.length);
        setTimeout(() => {
          textarea.setSelectionRange(newStart, newEnd);
        }, 0);
      } else {

        if (selectedText.includes('\n')) {
          const lines = selectedText.split('\n');
          const indentedLines = lines.map(line => '  ' + line);
          const newText = indentedLines.join('\n');

          const beforeSelection = value.substring(0, start);
          const afterSelection = value.substring(end);
          const newValue = beforeSelection + newText + afterSelection;

          onChange(newValue);


          const newStart = start;
          const newEnd = start + newText.length;
          setTimeout(() => {
            textarea.setSelectionRange(newStart, newEnd);
          }, 0);
        } else {

          const beforeCursor = value.substring(0, start);
          const afterCursor = value.substring(end);
          const newValue = beforeCursor + '  ' + afterCursor;

          onChange(newValue);


          setTimeout(() => {
            textarea.setSelectionRange(start + 2, start + 2);
          }, 0);
        }
      }
    }

    if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      let commentChar = '//';
      if (language === 'python') commentChar = '#';

      if (selectedText.includes('\n')) {

        const lines = selectedText.split('\n');
        const commentedLines = lines.map(line => commentChar + ' ' + line);
        const newText = commentedLines.join('\n');

        const beforeSelection = value.substring(0, start);
        const afterSelection = value.substring(end);
        const newValue = beforeSelection + newText + afterSelection;

        onChange(newValue);
      } else {

        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', start);
        const lineText = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);

        const newLineText = commentChar + ' ' + lineText;
        const beforeLine = value.substring(0, lineStart);
        const afterLine = value.substring(lineEnd === -1 ? value.length : lineEnd);
        const newValue = beforeLine + newLineText + afterLine;

        onChange(newValue);
      }
    }

    if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setShowFindReplace(true);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const indent = getIndentation(value, start);

      const beforeCursor = value.substring(0, start);
      const afterCursor = value.substring(end);
      const newValue = beforeCursor + '\n' + indent + afterCursor;

      onChange(newValue);

      setTimeout(() => {
        const newCursorPos = start + 1 + indent.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const findMatches = (searchText: string) => {
    if (!searchText) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const flags = caseSensitive ? 'g' : 'gi';
    let regex: RegExp;

    if (wholeWord) {
      regex = new RegExp(`\\b${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, flags);
    } else {
      regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    }

    const newMatches: Array<{ start: number, end: number }> = [];
    let match;
    while ((match = regex.exec(value)) !== null) {
      newMatches.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }

    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);

    if (newMatches.length > 0 && textareaRef.current) {
      textareaRef.current.setSelectionRange(newMatches[0].start, newMatches[0].end);
      textareaRef.current.focus();
    }
  };

  const findNext = () => {
    if (matches.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);

    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(matches[nextIndex].start, matches[nextIndex].end);
      textareaRef.current.focus();
    }
  };

  const findPrevious = () => {
    if (matches.length === 0) return;

    const prevIndex = currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);

    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(matches[prevIndex].start, matches[prevIndex].end);
      textareaRef.current.focus();
    }
  };

  const replace = () => {
    if (matches.length === 0 || currentMatchIndex === -1) return;

    const match = matches[currentMatchIndex];
    const newValue = value.substring(0, match.start) + replaceText + value.substring(match.end);
    onChange(newValue);

    setTimeout(() => findMatches(findText), 0);
  };

  const replaceAll = () => {
    if (!findText) return;

    let newValue = value;
    const flags = caseSensitive ? 'g' : 'gi';
    let regex: RegExp;

    if (wholeWord) {
      regex = new RegExp(`\\b${findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, flags);
    } else {
      regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    }

    newValue = newValue.replace(regex, replaceText);
    onChange(newValue);

    setMatches([]);
    setCurrentMatchIndex(-1);
  };

  return (
    <div
      className={cn(
        "relative flex h-full overflow-hidden rounded-lg border bg-card",
        className
      )}
    >
      <div className="flex-shrink-0 select-none border-r bg-muted/30 px-2 sm:px-3 py-4 text-right font-mono text-xs sm:text-sm text-muted-foreground">
        {lineNumbers.map((num) => (
          <div key={num} className="leading-6">
            {num}
          </div>
        ))}
      </div>


      <div ref={containerRef} className="relative flex-1 overflow-hidden">

        <div
          ref={highlighterRef}
          className="absolute inset-0 h-full overflow-auto rounded-none border-0 bg-transparent font-mono text-xs sm:text-sm leading-6 pointer-events-none whitespace-pre-wrap break-words select-none"
          style={{
            padding: '1rem',
            lineHeight: '1.5rem',
            color: 'transparent',
          }}
        >
          <SyntaxHighlighter code={value} language={language} />
        </div>

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 h-full resize-none rounded-none border-0 bg-transparent font-mono text-xs sm:text-sm leading-6 focus-visible:ring-0 focus-visible:ring-offset-0 caret-black dark:caret-white z-10"
          placeholder={`Write your ${language.toUpperCase()} code here...`}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            padding: '1rem',
            lineHeight: '1.5rem',
            color: 'inherit',
            backgroundColor: 'transparent',
          }}
        />
      </div>


      <Dialog open={showFindReplace} onOpenChange={setShowFindReplace}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Find and Replace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Find</label>
              <Input
                value={findText}
                onChange={(e) => {
                  setFindText(e.target.value);
                  findMatches(e.target.value);
                }}
                placeholder="Search text..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') findNext();
                  if (e.key === 'Escape') setShowFindReplace(false);
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Replace with</label>
              <Input
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replacement text..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') replace();
                  if (e.key === 'Escape') setShowFindReplace(false);
                }}
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                />
                <span>Case sensitive</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                />
                <span>Whole word</span>
              </label>
            </div>
            {matches.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {matches.length} match{matches.length !== 1 ? 'es' : ''} found
                {currentMatchIndex >= 0 && ` (${currentMatchIndex + 1} of ${matches.length})`}
              </div>
            )}
            <div className="flex justify-between space-x-2">
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={findPrevious} disabled={matches.length === 0}>
                  <Search className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button size="sm" variant="outline" onClick={findNext} disabled={matches.length === 0}>
                  <Search className="w-4 h-4 mr-1" />
                  Next
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={replace} disabled={matches.length === 0}>
                  <Replace className="w-4 h-4 mr-1" />
                  Replace
                </Button>
                <Button size="sm" variant="outline" onClick={replaceAll} disabled={!findText}>
                  <Replace className="w-4 h-4 mr-1" />
                  Replace All
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
