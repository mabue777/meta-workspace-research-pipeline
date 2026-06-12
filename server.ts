import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Proxy wrapper for basic text query using gemini-3.5-flash
  app.post('/api/research/query', async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are a meticulous research assistant. Answer clearly and comprehensively, structured with markdown.',
        },
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true },
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error('Gemini error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Deep thinking query using gemini-3.1-pro-preview HIGH
  app.post('/api/research/deep-query', async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: 'You are an advanced researcher. Provide an exhaustive, deeply reasoned analysis. You must use markdown.',
          thinkingConfig: { thinkingLevel: 'HIGH' }
        },
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true },
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error('Gemini deep query error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Low latency query using gemini-3.1-flash-lite
  app.post('/api/research/fast-query', async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: 'You are a fast answering assistant. Give a very brief, concise response.',
        },
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error('Gemini fast query error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Video processing via gemini-3.1-pro-preview
  app.post('/api/research/video', async (req, res) => {
    try {
      const { videoUrl, context } = req.body;
      // In a real app we'd attach the video file data or URI.
      // Assuming for now the URL might be a Google Drive link or YouTube link if Gemini can access it,
      // But typically we'd upload media. We'll use a standard prompt as this is a preview env and direct 
      // video uploading can be complex without a bucket.
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Analyze the insights from this video URL: ${videoUrl}\n\nContext: ${context || ''}`,
        config: {
          systemInstruction: 'You are an expert video analyst.',
        },
        tools: [{ googleSearch: {} }],
      });
      res.json({ summary: response.text });
    } catch (err: any) {
      console.error('Gemini video analysis error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Internal Doc restructuring
  app.post('/api/research/analyze-doc', async (req, res) => {
    try {
      const { title, text } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `TITLE: ${title}\n\nCONTENT: ${text}\n\nAnalyze this document and extract key findings, concepts, and a summary.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
              entities: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['summary', 'keyFindings', 'entities']
          }
        }
      });
      res.json({ result: response.text }); // JSON string
    } catch (err: any) {
      console.error('Doc analysis error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
