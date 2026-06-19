const FLAGS: Record<string, string> = {
  cs: "🇨🇿",
  en: "🇬🇧",
  de: "🇩🇪",
  pl: "🇵🇱",
  it: "🇮🇹",
  es: "🇪🇸",
  fr: "🇫🇷",
  ru: "🇷🇺",
  uk: "🇺🇦",
};

export const langFlag = (code: string): string => FLAGS[code] ?? "🌐";
