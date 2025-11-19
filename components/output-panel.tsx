"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OutputPanelProps {
  output: string;
  error: string;
  isRunning: boolean;
  executionTime?: number;
}

export function OutputPanel({
  output,
  error,
  isRunning,
  executionTime,
}: OutputPanelProps) {
  if (isRunning) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Compiling and running code...
          </p>
        </div>
      </div>
    );
  }

  if (!output && !error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Run your code to see output
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {error && (
        <Alert variant="destructive" className="mb-4 rounded-lg">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            <div className="font-semibold">Compilation Error:</div>
            <pre className="mt-2 whitespace-pre-wrap">{error}</pre>
          </AlertDescription>
        </Alert>
      )}

      {output && (
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Output</span>
            </div>
            {executionTime !== undefined && (
              <span className="text-xs text-muted-foreground">
                Executed in {executionTime}ms
              </span>
            )}
          </div>

          <ScrollArea className="h-[calc(100%-2rem)] rounded-lg border bg-card">
            <pre className="p-4 pr-6 font-mono text-sm">{output}</pre>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
