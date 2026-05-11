import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "./LanguageToggle";

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/70 px-4 py-3 backdrop-blur-xl md:px-8">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="focus-ring rounded-lg border border-slate-200 bg-white p-2 text-slate-700 md:hidden"
          aria-label={t("openNavigation")}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-500">{user?.role === "admin" ? t("administrator") : t("analyst")}</p>
          <h1 className="truncate text-lg font-semibold text-slate-950">{user?.name}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            onClick={logout}
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
