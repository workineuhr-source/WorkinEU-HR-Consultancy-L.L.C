import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import OpenAI from "openai";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

const app = express();
app.use(express.json());

// Content Security & HTTPs rules
// HTTPS is handled by the platform ingress


// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Initialize Firebase for Backend
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Global settings cache for rate limiting
let rateLimitSettings = { isEnabled: true, maxRequests: 100 };
let lastSettingsFetch = 0;

// Fetch settings helper
const getRateLimitSettings = async () => {
  const now = Date.now();
  if (now - lastSettingsFetch > 60000) { // Cache for 1 minute
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "system"));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.rateLimiting) {
          rateLimitSettings = data.rateLimiting;
        }
      }
      lastSettingsFetch = now;
    } catch (e) {
      console.error("Failed to fetch rate limit settings:", e);
    }
  }
  return rateLimitSettings;
};

// Start initial background fetch
getRateLimitSettings();

// Dynamic Rate Limiter Middleware
const dynamicRateLimiter = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const settings = await getRateLimitSettings();
  
  if (!settings.isEnabled) {
    return next();
  }

  // Create an on-the-fly limiter configuration or pull from cache 
  // We can just use the rateLimit module directly configured
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: settings.maxRequests || 100, 
    message: { error: "Too many requests. API Rate Limit exceeded." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Basic IP based key generator
      return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    }
  });

  return limiter(req, res, next);
};

// Apply rate limiting globally to all /api/ endpoints
app.use("/api/", dynamicRateLimiter);

// DB Backup Route
app.get("/api/backup", async (req, res, next) => {
  try {
    const collectionsToBackup = ["jobs", "candidates", "applications", "users"];
    const backupData: any = {};
    
    for (const colName of collectionsToBackup) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      backupData[colName] = {};
      snapshot.forEach(docSnap => {
        backupData[colName][docSnap.id] = docSnap.data();
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);
    res.json(backupData);
  } catch (error) {
    next(error);
  }
});


// AI Recommendation Route
app.post("/api/ai/recommend", async (req, res) => {
  const { profile, allJobs } = req.body;

  try {
    // 1. Fetch System Settings from Firestore
    const settingsDoc = await getDoc(doc(db, "settings", "system"));
    const settingsData = settingsDoc.exists() ? settingsDoc.data() : null;
    
    let activeConfig = null;
    if (settingsData && settingsData.apiConfigs && settingsData.apiConfigs.length > 0) {
      // Find correctly enabled config
      activeConfig = settingsData.apiConfigs.find((c: any) => c.isEnabled && c.id === settingsData.activeConfigId) 
                     || settingsData.apiConfigs.find((c: any) => c.isEnabled);
    }

    const provider = activeConfig?.provider || 'gemini';
    const apiKey = (activeConfig?.apiKey || process.env.GEMINI_API_KEY) as string;
    const modelName = activeConfig?.modelName || (provider === 'openai' ? 'gpt-4o' : 'gemini-3-flash-preview');

    if (!apiKey) {
      return res.status(500).json({ error: "AI API Key not configured" });
    }

    const profileContext = `
      Candidate Name: ${profile.fullName}
      Experience: ${profile.experience || 'Not specified'}
      Education: ${profile.education || 'Not specified'}
      Skills: ${profile.skills?.join(', ') || 'Not specified'}
    `;

    const jobsContext = allJobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      category: job.category,
      country: job.country,
      description: job.description.substring(0, 200) + '...'
    }));

    const prompt = `
      Based on the candidate profile provided, recommend the top 4 most relevant jobs from the list of available jobs.
      Return only a JSON array of job IDs.
      
      Candidate Profile:
      ${profileContext}
      
      Available Jobs:
      ${JSON.stringify(jobsContext)}
    `;

    let recommendedIds: string[] = [];

    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      const content = response.choices[0].message.content;
      recommendedIds = JSON.parse(content || "{}").ids || [];
    } else {
      // Gemini should be handled on the frontend per platform guidelines.
      // If we reach here for gemini, it means the frontend fallback failed or was bypassed.
      return res.status(400).json({ error: "Gemini provider must be handled client-side" });
    }

    res.json({ recommendedIds });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to get AI recommendations" });
  }
});

import { GoogleGenAI } from "@google/genai";

app.post("/api/generate-job-image", async (req, res) => {
  try {
    const { title, country, description, category } = req.body;
    
    // Instead of paid Imagen API, we use Pollinations AI for free high-quality image generation
    const prompt = `Professional high quality promotional banner for a job offering. ${title || "Job Opportunity"} in ${category || "Corporate"}. Location: ${country || "Global"}. Modern clean corporate branding, photorealistic or sleek 3D render.`;
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&nologo=true`;
    
    // Fetch the image to return as base64
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error("Failed to generate free image from Pollinations");
    
    const buffer = await imageRes.arrayBuffer();
    const base64Image = `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
    
    res.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

app.post("/api/generate-diary-image", async (req, res) => {
  try {
    const { title, category, content } = req.body;
    
    // Instead of paid Imagen API, we use Pollinations AI for free high-quality image generation
    const prompt = `High quality professional editorial banner image for a blog post. Title: ${title || "Blog Post"}. Category: ${category || "Corporate"}. Context: ${content ? content.substring(0, 100) : "News"}. Elegant modern design, no text.`;
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&nologo=true`;
    
    // Fetch the image to return as base64
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error("Failed to generate free image from Pollinations");
    
    const buffer = await imageRes.arrayBuffer();
    const base64Image = `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
    
    res.json({ imageUrl: base64Image });
  } catch (error: any) {
    console.error("Diary Image Gen Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// You can add more API routes here

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Error Handler Log:", err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? "An unexpected error occurred. Please try again later." : message,
    }
  });
});

export default app;
