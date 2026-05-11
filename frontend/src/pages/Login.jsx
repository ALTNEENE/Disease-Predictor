import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Activity, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";

export default function Login() {
  const { user, login, register } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") await register(form);
      else await login({ email: form.email, password: form.password });
    } catch (err) {
      setError(err.response?.data?.message || t("authenticationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute end-4 top-4">
        <LanguageToggle />
      </div>
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg shadow-soft md:grid-cols-[1fr_1.1fr]">
        <div className="dark-glass hidden p-10 text-white md:block">
          <div className="mb-16 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-teal-400 text-slate-950">
              <Activity className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("appName")}</h1>
              <p className="text-sm text-slate-300">{t("medicalWorkspace")}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="mb-4 h-8 w-8 text-teal-300" />
              <p className="text-3xl font-bold leading-tight">{t("loginHeroTitle")}</p>
            </div>
            <p className="text-sm leading-6 text-slate-300">{t("loginHeroBody")}</p>
          </div>
        </div>
        <form onSubmit={submit} className="glass bg-white/85 p-6 sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold text-slate-950">{mode === "login" ? t("login") : t("register")}</h2>
          <p className="mt-2 text-sm text-slate-500">{t("firstAdmin")}</p>

          {error && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="mt-6 space-y-4">
            {mode === "register" && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">{t("name")}</span>
                <input
                  className="focus-ring w-full rounded-lg border border-slate-200 px-4 py-3"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{t("email")}</span>
              <input
                className="focus-ring w-full rounded-lg border border-slate-200 px-4 py-3"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{t("password")}</span>
              <input
                className="focus-ring w-full rounded-lg border border-slate-200 px-4 py-3"
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="focus-ring mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "..." : mode === "login" ? t("login") : t("register")}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="mt-4 w-full text-sm font-medium text-teal-700"
          >
            {mode === "login" ? t("register") : t("login")}
          </button>
        </form>
      </section>
    </main>
  );
}
