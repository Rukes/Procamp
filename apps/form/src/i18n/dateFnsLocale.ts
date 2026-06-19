import { cs } from "date-fns/locale/cs";
import { enUS } from "date-fns/locale/en-US";
import { de } from "date-fns/locale/de";
import { pl } from "date-fns/locale/pl";
import { it } from "date-fns/locale/it";
import { es } from "date-fns/locale/es";
import { fr } from "date-fns/locale/fr";
import { ru } from "date-fns/locale/ru";
import { uk } from "date-fns/locale/uk";
import { sk } from "date-fns/locale/sk";
import { hu } from "date-fns/locale/hu";
import type { Locale } from "date-fns";

const locales: Record<string, Locale> = { cs, en: enUS, de, pl, it, es, fr, ru, uk, sk, hu };

export function getDateLocale(lang: string): Locale {
  return locales[lang] ?? cs;
}
