import { useT } from "../i18n";
import { Language } from "@procamp/shared";

interface Props {
  current: number;
  lang: Language;
}

export default function StepIndicator({ current, lang }: Props) {
  const t = useT(lang.code);
  const STEPS = [t.stepType, t.stepDate, t.stepConfig, t.stepContact];

  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done ? "bg-blue-600 text-white" : active ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${active ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
