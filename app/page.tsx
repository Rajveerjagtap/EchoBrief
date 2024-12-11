"use client";

import { Upload, Mic, FileAudio, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import FileUpload from "@/components/FileUpload";
import TranscriptionResult from "@/components/TranscriptionResult";
import LiveTranscription from "@/components/LiveTranscription";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [summary, setSummary] = useState("");
  const [activeTab, setActiveTab] = useState<'upload' | 'live'>('upload');

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('audio', file);

    try {
      // Upload and transcribe
      const transcribeResponse = await fetch('http://localhost:3001/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!transcribeResponse.ok) throw new Error('Transcription failed');
      
      const transcribeData = await transcribeResponse.json();
      setTranscription(transcribeData.transcription);
      setProgress(50);

      // Get summary
      const summaryResponse = await fetch('http://localhost:3001/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: transcribeData.transcription })
      });

      if (!summaryResponse.ok) throw new Error('Summarization failed');

      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary);
      setProgress(100);

      toast({
        title: "Success!",
        description: "Your lecture has been processed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Lecture Notes Assistant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Transform your lectures into organized notes with AI-powered transcription and summarization
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-8">
          <Button
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Audio
          </Button>
          <Button
            variant={activeTab === 'live' ? 'default' : 'outline'}
            onClick={() => setActiveTab('live')}
          >
            <Mic className="w-4 h-4 mr-2" />
            Live Recording
          </Button>
        </div>

        {activeTab === 'upload' ? (
          <>
            <Card className="p-6 mb-8">
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center">
                  {!isProcessing ? (
                    <FileUpload onFileSelect={handleFileUpload} />
                  ) : (
                    <div className="w-full space-y-4">
                      <Progress value={progress} className="w-full" />
                      <p className="text-center text-sm text-gray-500">
                        Processing your lecture... {progress}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {(transcription || summary) && (
              <TranscriptionResult 
                transcription={transcription} 
                summary={summary} 
              />
            )}
          </>
        ) : (
          <LiveTranscription />
        )}
      </div>
    </main>
  );
}