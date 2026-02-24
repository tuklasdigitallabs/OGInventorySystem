"use client";

import { useEffect } from "react";

export function PwaBootstrap(): null {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}

