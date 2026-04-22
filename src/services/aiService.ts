import { Job, CandidateProfile } from "../types";

export async function getJobRecommendations(profile: CandidateProfile, allJobs: Job[]): Promise<string[]> {
  if (!allJobs.length) return [];

  try {
    const response = await fetch("/api/ai/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile, allJobs }),
    });

    if (!response.ok) {
      throw new Error("Failed to get AI recommendations");
    }

    const { recommendedIds } = await response.json();
    return recommendedIds || [];
  } catch (error) {
    console.error("Error getting job recommendations:", error);
    return [];
  }
}
