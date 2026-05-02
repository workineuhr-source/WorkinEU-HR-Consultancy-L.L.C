import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDirectImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  
  try {
    // Handle Google Drive links
    if (url.includes("drive.google.com")) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    
    // Handle Dropbox links
    if (url.includes("dropbox.com")) {
      return url.replace("www.dropbox.com", "dl.dropboxusercontent.com").replace("?dl=0", "");
    }
    
    // Check if it's an Imgur page rather than direct image
    if (url.includes("imgur.com") && !url.includes("i.imgur.com")) {
      const match = url.match(/imgur\.com\/([a-zA-Z0-9]+)$/);
      if (match && match[1]) {
        return `https://i.imgur.com/${match[1]}.jpg`;
      }
    }
  } catch (error) {
    console.error("Error formatting image URL:", error);
  }
  
  return url;
}
