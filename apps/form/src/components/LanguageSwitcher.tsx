import { Language } from "@procamp/shared";

const LANG_TO_COUNTRY: Record<string, string> = {
  cs: "cz", en: "gb", de: "de", pl: "pl",
  it: "it", es: "es", fr: "fr", ru: "ru", uk: "ua",
  sk: "sk", hu: "hu", nl: "nl",
};

interface Props {
  languages: Language[];
  current: string;
  onChange: (code: string) => void;
}

export default function LanguageSwitcher({ languages, current, onChange }: Props) {
  if (languages.length <= 1) return null;

  return (
    <div className="flex gap-1 justify-end mb-4">
      {languages.map((lang) => {
        const country = LANG_TO_COUNTRY[lang.code];
        return (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              current === lang.code
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {country
              ? <span className={`fi fi-${country}`} style={{ borderRadius: 2 }} />
              : <span>🌐</span>
            }
            <span>{lang.code.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
