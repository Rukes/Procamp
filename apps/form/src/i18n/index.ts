import type { Translations } from "./types";
import { cs } from "./cs";
import { en } from "./en";
import { de } from "./de";
import { pl } from "./pl";
import { it } from "./it";
import { es } from "./es";
import { fr } from "./fr";
import { ru } from "./ru";
import { uk } from "./uk";
import { sk } from "./sk";
import { hu } from "./hu";

const translations: Record<string, Translations> = { cs, en, de, pl, it, es, fr, ru, uk, sk, hu };

export function useT(lang: string): Translations {
  return translations[lang] ?? translations["cs"];
}

export type { Translations };
