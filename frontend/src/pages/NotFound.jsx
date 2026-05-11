import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="glass rounded-lg p-10 text-center">
      <h1 className="text-3xl font-bold text-slate-950">{t("pageNotFound")}</h1>
      <Link className="mt-4 inline-flex rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white" to="/">
        {t("backToDashboard")}
      </Link>
    </div>
  );
}
