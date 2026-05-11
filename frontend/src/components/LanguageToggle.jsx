import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageToggle() {
  const { toggleLanguage, t } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={t("language")}
      className="focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-teal-300"
    >
      <Languages className="h-4 w-4" />
      {t("language")}
    </button>
  );
}
