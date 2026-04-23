import express from "express";
import OpenAI from "openai";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

const app = express();
app.use(express.json());

// Initialize Firebase for Backend
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

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

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// You can add more API routes here

export default app;
