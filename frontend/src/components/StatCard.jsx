import { compactNumber } from "../utils/formatters";
import { useLanguage } from "../context/LanguageContext";

export default function StatCard({ title, value, icon: Icon, tone = "teal", delay = 0 }) {
  const { language } = useLanguage();
  const tones = {
    teal: "from-teal-500 to-cyan-500",
    blue: "from-blue-500 to-indigo-500",
    rose: "from-rose-500 to-orange-500",
    amber: "from-amber-500 to-lime-500"
  };

  return (
    <div className="stat-card glass rounded-lg p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{compactNumber(value, language)}</p>
        </div>
        {Icon && (
          <div className={`rounded-lg bg-gradient-to-br ${tones[tone]} p-3 text-white shadow-soft`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
