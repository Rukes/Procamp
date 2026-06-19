import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Camp } from "@procamp/shared";
import { useAuth } from "../contexts/AuthContext";

export default function CampsPage() {
  const { can } = useAuth();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  const load = () => api.get("/camps").then((r) => setCamps(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/camps", { name, slug });
      setCreating(false); setName(""); setSlug("");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Chyba při vytváření kempu");
    }
  };

  const handleDelete = async (id: string, campName: string) => {
    if (!confirm(`Opravdu smazat kemp "${campName}"? Tato akce je nevratná.`)) return;
    await api.delete(`/camps/${id}`);
    load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kempy</h1>
        {can("camps_create") && (
          <button className="btn-primary" onClick={() => setCreating(true)}>+ Nový kemp</button>
        )}
      </div>

      {creating && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold mb-4">Nový kemp</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="label">Název kempu</label>
              <input className="input" value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} required />
            </div>
            <div>
              <label className="label">URL slug (identifikátor)</label>
              <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" />
              <p className="text-xs text-gray-500 mt-1">Použije se v URL formuláře: /form/<strong>{slug || "nazev-kempu"}</strong></p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button className="btn-primary" type="submit">Vytvořit</button>
              <button className="btn-secondary" type="button" onClick={() => setCreating(false)}>Zrušit</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {camps.map((camp) => (
          <div key={camp.id} className="card p-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{camp.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">slug: <code className="bg-gray-100 px-1 rounded">{camp.slug}</code></p>
              <p className="text-sm text-gray-500 mt-1">
                Karavany: {camp.caravanCapacity} míst · Stany: {camp.tentCapacity} míst
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/camps/${camp.id}`} className="btn-secondary">Spravovat</Link>
              {can("camps_delete") && (
                <button className="btn-danger" onClick={() => handleDelete(camp.id, camp.name)}>Smazat</button>
              )}
            </div>
          </div>
        ))}
        {camps.length === 0 && !creating && (
          <div className="card p-12 text-center text-gray-400">
            <p className="text-lg mb-2">Žádné kempy</p>
            <p className="text-sm">Vytvořte první kemp kliknutím na „+ Nový kemp".</p>
          </div>
        )}
      </div>
    </div>
  );
}
