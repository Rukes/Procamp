const COUNTRIES = [
  "Česká republika",
  "Albánie", "Andorra", "Rakousko", "Bělorusko", "Belgie", "Bosna a Hercegovina",
  "Bulharsko", "Chorvatsko", "Kypr", "Dánsko", "Estonsko", "Finsko", "Francie",
  "Německo", "Řecko", "Maďarsko", "Island", "Irsko", "Itálie", "Kosovo",
  "Lotyšsko", "Lichtenštejnsko", "Litva", "Lucembursko", "Malta", "Moldavsko",
  "Monako", "Černá Hora", "Nizozemsko", "Severní Makedonie", "Norsko", "Polsko",
  "Portugalsko", "Rumunsko", "San Marino", "Srbsko", "Slovensko", "Slovinsko",
  "Španělsko", "Švédsko", "Švýcarsko", "Turecko", "Ukrajina", "Spojené království",
  "Vatikán",
  "──────────",
  "Jiná mimo EU",
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export default function CountrySelect({ value, onChange, className }: Props) {
  return (
    <select
      className={className ?? "input"}
      value={value}
      onChange={(e) => { if (e.target.value !== "──────────") onChange(e.target.value); }}
    >
      <option value="">— Vyberte zemi —</option>
      {COUNTRIES.map((c) => (
        <option key={c} value={c} disabled={c === "──────────"}>{c}</option>
      ))}
    </select>
  );
}
