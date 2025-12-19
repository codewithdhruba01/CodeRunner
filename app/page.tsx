"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { CodeEditor } from "@/components/code-editor";
import { OutputPanel } from "@/components/output-panel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Share2, RotateCcw, Copy, Check, Download } from "lucide-react";
import { codeTemplates, languageNames } from "@/lib/code-templates";
import { getSupabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Language = "c" | "cpp" | "java" | "python";

function HomeContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(codeTemplates.python);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>();
  const [streamingOutput, setStreamingOutput] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const shareId = searchParams.get("share");
    if (shareId) {
      loadSharedCode(shareId);
    }
  }, [searchParams]);

  const loadSharedCode = async (shareId: string) => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        toast({
          title: "Supabase Not Configured",
          description: "Cannot load shared code. Supabase environment variables are not set up.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("code_snippets")
        .select("*")
        .eq("share_id", shareId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setLanguage(data.language as Language);
        setCode(data.code);
        toast({
          title: "Code loaded successfully",
          description: `Loaded shared ${languageNames[data.language as Language]
            } code`,
        });
      } else {
        toast({
          title: "Code Not Found",
          description: "The shared code link is invalid or has expired.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error loading shared code:", err);
      toast({
        title: "Error",
        description: "Failed to load shared code",
        variant: "destructive",
      });
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setCode(codeTemplates[newLanguage]);
    setOutput("");
    setError("");
    setExecutionTime(undefined);
    setStreamingOutput("");
  };

  const handleReset = () => {
    setCode(codeTemplates[language]);
    setOutput("");
    setError("");
    setExecutionTime(undefined);
    setStreamingOutput("");
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");
    setExecutionTime(undefined);
    setStreamingOutput("");

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          code,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Display output line by line with smooth streaming effect
        const fullOutput = result.output || "Program executed successfully (no output)";
        setStreamingOutput(fullOutput);

        // Display output line by line to simulate real-time streaming
        let currentOutput = "";
        const outputLines = fullOutput.split('\n');

        for (let i = 0; i < outputLines.length; i++) {
          const line = outputLines[i];
          // Add the complete line at once instead of character by character
          currentOutput += line;
          if (i < outputLines.length - 1) {
            currentOutput += '\n';
          }

          setOutput(currentOutput);

          // Add a small delay between lines to simulate streaming
          if (i < outputLines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between lines
          }
        }

        setExecutionTime(result.executionTime);
      } else {
        setError(result.error || "An unknown error occurred");
      }
    } catch (err) {
      setError(
        "Failed to execute code. Please check your connection and try again."
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleShareCode = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        toast({
          title: "Supabase Not Configured",
          description: "Please set up Supabase environment variables to enable code sharing. Check .env.local file.",
          variant: "destructive",
        });
        return;
      }

      const shareId = Math.random().toString(36).substring(2, 10);

      const { error } = await supabase.from("code_snippets").insert({
        share_id: shareId,
        language,
        code,
      });

      if (error) throw error;

      const shareUrl = `${window.location.origin}?share=${shareId}`;
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Share link copied!",
        description: "Share URL has been copied to your clipboard",
      });
    } catch (err) {
      console.error("Error sharing code:", err);
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Code copied!",
        description: "Code has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCode = () => {
    const fileName = prompt('Enter filename (without extension):', `code_${language}`);
    if (!fileName || !fileName.trim()) {
      toast({
        title: "Cancelled",
        description: "Download cancelled",
      });
      return;
    }

    const extensions = {
      python: '.py',
      c: '.c',
      cpp: '.cpp',
      java: '.java'
    };

    const extension = extensions[language];
    const fullFileName = `${fileName.trim()}${extension}`;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fullFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started!",
      description: `${fullFileName} is being downloaded`,
    });
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b bg-muted/30 px-3 sm:px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Select
                value={language}
                onValueChange={(value) =>
                  handleLanguageChange(value as Language)
                }
              >
                <SelectTrigger className="w-[120px] sm:w-[140px] text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleRunCode}
                disabled={isRunning}
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{isRunning ? "Running..." : "Run Code"}</span>
                <span className="sm:hidden">Run</span>
              </Button>

              <Button variant="outline" onClick={handleReset} className="gap-1 sm:gap-2 text-xs sm:text-sm" size="sm">
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Reset</span>
                <span className="sm:hidden">Reset</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <Button
                variant="outline"
                onClick={handleCopyCode}
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
                size="sm"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Copied</span>
                    <span className="sm:hidden">✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Copy Code</span>
                    <span className="sm:hidden">Copy</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleShareCode}
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Share</span>
                <span className="sm:hidden">Share</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleDownloadCode}
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Download</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 sm:gap-4 overflow-hidden py-3 sm:py-4 px-3 sm:px-6 lg:flex-row justify-center">
          {/* LEFT SIDE EDITOR */}
          <div className="flex flex-col gap-2 w-full lg:w-[45%]">
            <h2 className="text-xs sm:text-sm font-bold font-sans">Code Editor</h2>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              className="flex-1 min-h-[250px] sm:min-h-[350px]"
            />
          </div>

          {/* RIGHT SIDE OUTPUT */}
          <div className="flex flex-col gap-2 w-full lg:w-[45%]">
            <h2 className="text-xs sm:text-sm font-bold font-sans">Output</h2>
            <div className="flex-1 overflow-hidden rounded-lg border bg-card p-3 sm:p-4 min-h-[250px] sm:min-h-[350px]">
              <OutputPanel
                output={output}
                error={error}
                isRunning={isRunning}
                executionTime={executionTime}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
