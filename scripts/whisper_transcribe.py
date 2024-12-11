import sys
import whisper
import torch

def transcribe_audio(audio_path):
    # Check if CUDA is available, otherwise use CPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Load the base model as it's more suitable for CPU
    model = whisper.load_model("base", device=device)
    
    try:
        # Transcribe the audio
        result = model.transcribe(audio_path)
        print(result["text"])
        return True
    except Exception as e:
        print(f"Error during transcription: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python whisper_transcribe.py <audio_file_path>", file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    success = transcribe_audio(audio_path)
    sys.exit(0 if success else 1)