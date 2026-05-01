import { Job, CandidateProfile, SystemSettings } from "../types";
import { GoogleGenAI } from "@google/genai";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

// Initialize Gemini on the frontend
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function getJobRecommendations(
  profile: CandidateProfile,
  allJobs: Job[],
): Promise<string[]> {
  if (!allJobs.length) return [];

  try {
    // 1. Fetch System Settings to see if we should use local Gemini or backend (for OpenAI)
    const settingsDoc = await getDoc(doc(db, "settings", "system"));
    const settingsData = settingsDoc.exists()
      ? (settingsDoc.data() as SystemSettings)
      : null;

    let activeConfig = null;
    if (
      settingsData &&
      settingsData.apiConfigs &&
      settingsData.apiConfigs.length > 0
    ) {
      activeConfig =
        settingsData.apiConfigs.find(
          (c: any) => c.isEnabled && c.id === settingsData.activeConfigId,
        ) || settingsData.apiConfigs.find((c: any) => c.isEnabled);
    }

    const provider = activeConfig?.provider || "gemini";
    const modelName = activeConfig?.modelName || "gemini-3-flash-preview";

    // If provider is NOT gemini (e.g. OpenAI), we still use the backend proxy
    // to protect non-Gemini keys.
    if (provider !== "gemini") {
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile, allJobs }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI recommendations from backend");
      }

      const { recommendedIds } = await response.json();
      return recommendedIds || [];
    }

    // 2. Perform Gemini recommendation on the frontend (Platform mandated)
    const profileContext = `
      Candidate Name: ${profile.fullName}
      Experience: ${profile.experience || "Not specified"}
      Education: ${profile.education || "Not specified"}
      Skills: ${profile.skills?.join(", ") || "Not specified"}
    `;

    const jobsContext = allJobs.slice(0, 20).map((job: any) => ({
      id: job.id,
      title: job.title,
      category: job.category,
      country: job.country,
      description: job.description.substring(0, 200) + "...",
    }));

    const prompt = `
      Based on the candidate profile provided, recommend the top 4 most relevant jobs from the list of available jobs.
      Return only a JSON array of job IDs.
      
      Candidate Profile:
      ${profileContext}
      
      Available Jobs:
      ${JSON.stringify(jobsContext)}
    `;

    // Use the model name from config or default
    const response = await ai.models.generateContent({
      model: modelName.includes("gemini-1.5")
        ? "gemini-3-flash-preview"
        : modelName, // Ensure we use supported models
      contents: prompt,
    });

    const text = response.text || "";
    // Extract array from text if it's not pure JSON
    const match = text.match(/\[.*\]/s);
    const recommendedIds = match ? JSON.parse(match[0]) : [];

    return recommendedIds || [];
  } catch (error) {
    console.error("Error getting job recommendations:", error);
    return [];
  }
}
