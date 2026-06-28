"use client";
import { useEffect } from "react";
import { warmUpBackend } from "@/lib/api";

/** Pings the backend the instant any page mounts, so a sleeping free-tier server starts waking up before the user clicks anything. */
export default function WarmUpEngine() {
  useEffect(() => {
    warmUpBackend();
  }, []);
  return null;
}
