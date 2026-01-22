"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MockAIService } from '@/lib/ai-service';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SummarizerProps {
  content: string;
}

export function Summarizer({ content }: SummarizerProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const result = await MockAIService.summarize(content);
      setSummary(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2">
        {!summary && !loading && (
          <div className="flex flex-col items-center justify-center p-6 text-center h-40">
            <Sparkles className="h-8 w-8 text-cyan-400 mb-2" />
            <h3 className="font-semibold text-sm mb-1">Summarize Note</h3>
            <p className="text-xs text-muted-foreground">
              Generate a concise summary of your current note content.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center p-6 h-40 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground animate-pulse">Analyzing content...</p>
          </div>
        )}

        {summary && (
          <div className="prose prose-sm dark:prose-invert prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 text-xs">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="pt-4 mt-auto border-t border-cyan-500/20">
        {!summary ? (
          <Button
            className="w-full gap-2"
            onClick={handleSummarize}
            disabled={loading || !content}
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Generating..." : "Generate Summary"}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSummary(null)}>
              Reset
            </Button>
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
