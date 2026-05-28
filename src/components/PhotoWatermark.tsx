import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getDirectImageUrl } from "../lib/utils";

let cachedLogo: string | null = null;
let logoPromise: Promise<string | null> | null = null;

export const getSiteLogo = async (): Promise<string | null> => {
  if (cachedLogo !== null) return cachedLogo;
  if (!logoPromise) {
    logoPromise = getDoc(doc(db, "settings", "siteContent")).then((snap) => {
      const url = snap.exists() ? snap.data().logoUrl || null : null;
      cachedLogo = url;
      return url;
    });
  }
  return logoPromise;
};

export default function PhotoWatermark() {
  const [logo, setLogo] = useState<string | null>(cachedLogo);

  useEffect(() => {
    if (!logo) {
      getSiteLogo().then((url) => {
        if (url) setLogo(url);
      });
    }
  }, [logo]);

  if (!logo) return null;

  return (
    <div className="absolute top-4 right-4 z-[20] w-12 h-12 md:w-16 md:h-16 bg-white/60 dark:bg-black/60 backdrop-blur-md rounded-xl shadow-xl p-1.5 md:p-2 border border-white/40 pointer-events-none">
      <img
        src={getDirectImageUrl(logo)}
        alt="Watermark"
        className="w-full h-full object-contain drop-shadow-md"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
