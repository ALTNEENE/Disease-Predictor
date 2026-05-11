import { NavLink } from "react-router-dom";
import { Activity, BarChart3, BrainCircuit, FileBarChart, LayoutDashboard, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ open, onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const items = [
    { to: "/", label: t("dashboard"), icon: LayoutDashboard },
    { to: "/upload", label: t("upload"), icon: UploadCloud },
    { to: "/train", label: t("train"), icon: BrainCircuit },
    { to: "/predict", label: t("predict"), icon: Activity },
    { to: "/analytics", label: t("analytics"), icon: BarChart3 },
    { to: "/reports", label: t("reports"), icon: FileBarChart }
  ];
  if (user?.role === "admin") items.push({ to: "/admin", label: t("admin"), icon: ShieldCheck });

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-950/40 md:hidden ${open ? "block" : "hidden"}`} onClick={onClose} />
      <aside
        className={`dark-glass fixed inset-y-0 start-0 z-40 w-72 max-w-[calc(100vw-2rem)] shrink-0 transform overflow-y-auto p-4 text-start text-white transition md:sticky md:inset-auto md:start-auto md:top-0 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "max-md:-translate-x-full max-md:rtl:translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="focus-ring absolute end-3 top-3 rounded-lg border border-white/10 bg-white/10 p-2 text-white md:hidden"
          aria-label={t("closeNavigation")}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-8 flex items-center gap-3 px-2 pe-10 md:pe-2">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-400 text-slate-950">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold">{t("appName")}</p>
            <p className="text-xs text-slate-300">{t("appSubtitle")}</p>
          </div>
        </div>
        <nav className="space-y-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-start gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="min-w-0 truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
