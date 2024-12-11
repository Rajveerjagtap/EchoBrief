const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', async (data) => {
    try {
      // Save the audio chunk
      const filename = `chunk-${Date.now()}.webm`;
      const filepath = path.join(uploadsDir, filename);
      await fs.writeFile(filepath, data);

      // Process with Whisper
      const transcription = await transcribeAudio(filepath);
      
      // Send transcription back to client
      ws.send(JSON.stringify({
        type: 'transcription',
        text: transcription
      }));

      // Generate and send summary if text is long enough
      if (transcription.split(' ').length > 50) {
        const summary = await generateSummary(transcription);
        ws.send(JSON.stringify({
          type: 'summary',
          text: summary
        }));
      }

      // Clean up temporary file
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process audio'
      }));
    }
  });
});

// File upload endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const transcription = await transcribeAudio(req.file.path);
    res.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// Summarization endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const summary = await generateSummary(text);
    res.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Summarization failed' });
  }
});

// Helper function for transcription
async function transcribeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    const process = spawn('python', [
      path.join(__dirname, '../scripts/whisper_transcribe.py'),
      audioPath
    ]);

    let output = '';
    let error = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      error += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Transcription failed: ${error}`));
      } else {
        resolve(output.trim());
      }
    });
  });
}

// Helper function for summarization
async function generateSummary(text) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(uploadsDir, `text-${Date.now()}.txt`);
    
    fs.writeFile(tempFile, text)
      .then(() => {
        const process = spawn('python', [
          path.join(__dirname, '../scripts/summarization.py'),
          tempFile
        ]);

        let output = '';
        let error = '';

        process.stdout.on('data', (data) => {
          output += data.toString();
        });

        process.stderr.on('data', (data) => {
          error += data.toString();
        });

        process.on('close', (code) => {
          fs.unlink(tempFile).catch(console.error);
          
          if (code !== 0) {
            reject(new Error(`Summarization failed: ${error}`));
          } else {
            resolve(output.trim());
          }
        });
      })
      .catch(reject);
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});