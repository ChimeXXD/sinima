"use client";

import { createContext, useContext } from "react";
import type { City } from "@/lib/city";

// Each cinema's city, from data/cinemas.json, handed down by the root layout so the tab bar can
// count the saved cinemas of the page's city only (D-136). A few dozen ids: no registry in the bundle.

const Cities = createContext<Readonly<Record<string, City>>>({});

export function CinemaCities({ value, children }: { value: Readonly<Record<string, City>>; children: React.ReactNode }) {
  return <Cities value={value}>{children}</Cities>;
}

/** A cinema id's city, or undefined for an id the registry no longer has. */
export function useCinemaCities(): Readonly<Record<string, City>> {
  return useContext(Cities);
}
