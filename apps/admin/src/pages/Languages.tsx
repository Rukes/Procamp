import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Language } from "@procamp/shared";
import { useAuth } from "../contexts/AuthContext";

export default function LanguagesPage() {
  const { can } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const load = () => api.get("/languages").then((r) => setLanguages(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/languages", { code, name });
    setCode(""); setName("");
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Smazat jazyk?")) return;
    await api.delete(`/languages/${id}`);
    load();
  };

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Jazyky formuláře</h1>
      <p className="text-sm text-gray-600 mb-6">Přidejte jazyky, ve kterých se bude rezervační formulář zobrazovat zákazníkům. Výchozí jazyk je čeština.</p>

      <div className="space-y-2 mb-6">
        {languages.map((lang) => (
          <div key={lang.id} className="card p-4 flex items-center justify-between">
            <div>
              <span className="font-medium">{lang.name}</span>
              <span className="ml-2 text-sm text-gray-400">({lang.code})</span>
              {lang.isDefault && <span className="ml-2 badge bg-blue-100 text-blue-700">Výchozí</span>}
            </div>
            {!lang.isDefault && can("settings_edit") && (
              <button className="btn-danger text-sm" onClick={() => handleDelete(lang.id)}>Smazat</button>
            )}
          </div>
        ))}
      </div>

      {can("settings_edit") && (
        <form onSubmit={handleAdd} className="card p-5">
          <h2 className="font-semibold mb-3">Přidat jazyk</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Kód jazyka</label>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} placeholder="en" required maxLength={5} />
            </div>
            <div>
              <label className="label">Název</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="English" required />
            </div>
          </div>
          <button className="btn-primary" type="submit">Přidat jazyk</button>
        </form>
      )}
    </div>
  );
}
