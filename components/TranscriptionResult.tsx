"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface TranscriptionResultProps {
  transcription: string;
  summary: string;
}

export default function TranscriptionResult({
  transcription,
  summary,
}: TranscriptionResultProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"transcription" | "summary">("transcription");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const handleDownload = (content: string, type: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lecture-${type}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex space-x-4 mb-4">
        <Button
          variant={activeTab === "transcription" ? "default" : "outline"}
          onClick={() => setActiveTab("transcription")}
        >
          Transcription
        </Button>
        <Button
          variant={activeTab === "summary" ? "default" : "outline"}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </Button>
      </div>

      <div className="bg-muted p-4 rounded-lg mb-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        <p className="whitespace-pre-wrap">
          {activeTab === "transcription" ? transcription : summary}
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() =>
            handleCopy(activeTab === "transcription" ? transcription : summary)
          }
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
        <Button
          onClick={() =>
            handleDownload(
              activeTab === "transcription" ? transcription : summary,
              activeTab
            )
          }
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </Card>
  );
}