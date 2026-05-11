import { Database } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function EmptyState({ title, description }) {
  const { t } = useLanguage();
  return (
    <div className="glass flex min-h-[220px] flex-col items-center justify-center rounded-lg p-8 text-center">
      <Database className="mb-4 h-10 w-10 text-teal-600" />
      <h3 className="text-lg font-semibold text-slate-900">{title || t("noData")}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>}
    </div>
  );
}
