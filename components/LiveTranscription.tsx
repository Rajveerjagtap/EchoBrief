"use client";

import { useState, useEffect, useRef } from 'react';
import RecordRTC from 'recordrtc';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

export default function LiveTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const recorderRef = useRef<RecordRTC | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = new WebSocket('ws://localhost:3001/live-transcribe');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'transcription') {
        setTranscription(prev => prev + ' ' + data.text);
      } else if (data.type === 'summary') {
        setSummary(data.text);
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        timeSlice: 1000,
        ondataavailable: (blob) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(blob);
          }
        }
      });

      recorderRef.current.startRecording();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current?.getBlob();
        if (blob) {
          // Final processing if needed
        }
        setIsRecording(false);
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Live Transcription</h2>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Live Transcription</h3>
            <div className="bg-muted p-4 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto">
              {transcription || "Transcription will appear here..."}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="bg-muted p-4 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto">
              {summary || "Summary will appear here..."}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}