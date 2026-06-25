import React from "react";

const LANG_TO_COUNTRY: Record<string, string> = {
  cs: "cz",
  en: "gb",
  de: "de",
  pl: "pl",
  it: "it",
  es: "es",
  fr: "fr",
  ru: "ru",
  uk: "ua",
  sk: "sk",
  hu: "hu",
  nl: "nl",
};

export function Flag({ code, className = "" }: { code: string; className?: string }) {
  const country = LANG_TO_COUNTRY[code];
  if (!country) return <span className={className}>🌐</span>;
  return <span className={`fi fi-${country} ${className}`} style={{ borderRadius: 2 }} />;
}
