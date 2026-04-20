import { GoogleGenAI, Type } from "@google/genai";
import { Job, CandidateProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getJobRecommendations(profile: CandidateProfile, allJobs: Job[]): Promise<string[]> {
  if (!allJobs.length) return [];

  const profileContext = `
    Candidate Name: ${profile.fullName}
    Experience: ${profile.experience || 'Not specified'}
    Education: ${profile.education || 'Not specified'}
    Skills: ${profile.skills?.join(', ') || 'Not specified'}
    Search History: ${profile.searchHistory?.join(', ') || 'None'}
  `;

  const jobsContext = allJobs.map(job => ({
    id: job.id,
    title: job.title,
    category: job.category,
    country: job.country,
    description: job.description.substring(0, 200) + '...'
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Based on the candidate profile and search history provided, recommend the top 4 most relevant jobs from the list of available jobs.
        Return only an array of job IDs.

        Candidate Profile:
        ${profileContext}

        Available Jobs:
        ${JSON.stringify(jobsContext)}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const recommendedIds = JSON.parse(response.text || "[]");
    return recommendedIds;
  } catch (error) {
    console.error("Error getting job recommendations:", error);
    return [];
  }
}
