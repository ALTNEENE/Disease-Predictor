import { Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Loading({ label }) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[240px] items-center justify-center text-slate-500">
      <Loader2 className="me-3 h-5 w-5 animate-spin text-teal-600" />
      <span>{label || t("loading")}...</span>
    </div>
  );
}
