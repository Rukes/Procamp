import { useTitle } from "../hooks/useTitle";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import HCaptcha from "../components/HCaptcha";

const hasCaptcha = !!import.meta.env.VITE_HCAPTCHA_SITE_KEY;

export default function LoginPage() {
  useTitle("Přihlášení");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCaptcha && !captchaToken) return;
    setError("");
    setLoading(true);
    try {
      await login(email, password, captchaToken);
      navigate("/dashboard");
    } catch {
      setError("Nesprávný e-mail nebo heslo.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card p-8 w-full max-w-sm">
        <img src="/logos/logo-color.png" alt="Logo" className="h-28 w-auto mb-4 mx-auto" />
        <p className="text-sm text-gray-500 mb-6 text-center">Přihlášení jako správce</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="label">Heslo</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <HCaptcha onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full justify-center" type="submit" disabled={loading || (hasCaptcha && !captchaToken)}>
            {loading ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Přihlašuji…</> : <><i className="fa-regular fa-arrow-right-to-bracket mr-1.5" />Přihlásit se</>}
          </button>
        </form>
      </div>
    </div>
  );
}
