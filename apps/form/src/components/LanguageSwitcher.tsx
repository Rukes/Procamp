import { Language } from "@procamp/shared";

interface Props {
  languages: Language[];
  current: string;
  onChange: (code: string) => void;
}

export default function LanguageSwitcher({ languages, current, onChange }: Props) {
  if (languages.length <= 1) return null;

  return (
    <div className="flex gap-1 justify-end mb-4">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            current === lang.code
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
