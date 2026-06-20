import { useState } from "react";
import { api } from "../api/client";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";

export default function UserSettingsPage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [emailForm, setEmailForm] = useState({ email: user?.email ?? "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmail(true);
    try {
      const r = await api.post("/auth/change-email", { email: emailForm.email });
      setUser(r.data);
      toast.success("E-mail byl změněn.");
    } catch (err: any) {
      toast.error(err.response?.data?.error === "Email is already in use"
        ? "Tento e-mail již používá jiný účet."
        : "Nepodařilo se změnit e-mail.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Nová hesla se neshodují."); return; }
    if (pwForm.newPassword.length < 8) { toast.error("Nové heslo musí mít alespoň 8 znaků."); return; }
    setSavingPw(true);
    try {
      await api.post("/auth/change-password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Heslo bylo změněno.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.error === "Current password is incorrect"
        ? "Současné heslo není správné."
        : "Nepodařilo se změnit heslo.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="p-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nastavení účtu</h1>
        <p className="text-sm text-gray-400 mt-0.5">{user?.name}</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4"><i className="fa-regular fa-envelope mr-2 text-gray-400" />Změna e-mailu</h2>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={emailForm.email}
              onChange={(e) => setEmailForm({ email: e.target.value })} required />
          </div>
          <button className="btn-primary px-8" type="submit" disabled={savingEmail || emailForm.email === user?.email}>
            <i className="fa-regular fa-floppy-disk mr-1.5" />{savingEmail ? "Ukládám…" : "Uložit e-mail"}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4"><i className="fa-regular fa-lock mr-2 text-gray-400" />Změna hesla</h2>
        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <label className="label">Současné heslo</label>
            <input className="input" type="password" value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label className="label">Nové heslo</label>
            <input className="input" type="password" value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={8} />
          </div>
          <div>
            <label className="label">Nové heslo znovu</label>
            <input className="input" type="password" value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
          </div>
          <button className="btn-primary px-8" type="submit" disabled={savingPw}>
            <i className="fa-regular fa-floppy-disk mr-1.5" />{savingPw ? "Ukládám…" : "Uložit heslo"}
          </button>
        </form>
      </div>
    </div>
  );
}
