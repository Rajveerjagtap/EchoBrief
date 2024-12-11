"use client";

import { useDropzone } from "react-dropzone";
import { Upload, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary"
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-primary/10 rounded-full">
          <FileAudio className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-medium">
            {isDragActive ? "Drop your audio file here" : "Upload your lecture recording"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop your audio file, or click to select
          </p>
        </div>
        <Button variant="outline" className="mt-4">
          <Upload className="w-4 h-4 mr-2" />
          Select File
        </Button>
      </div>
    </div>
  );
}