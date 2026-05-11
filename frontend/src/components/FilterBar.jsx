import { Filter } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function FilterBar({ options = {}, filters, onChange }) {
  const { t } = useLanguage();
  const selectClass = "focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm sm:w-auto";
  const fields = [
    ["state", options.states || []],
    ["weather", options.weather || []],
    ["month", options.months || []],
    ["gender", options.genders || []],
    ["ageGroup", options.ageGroups || []]
  ];

  return (
    <div className="glass mb-6 grid gap-3 rounded-lg p-4 sm:flex sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:me-1">
        <Filter className="h-4 w-4 text-teal-600" />
        {t("filters")}
      </div>
      {fields.map(([key, values]) => (
        <select
          key={key}
          value={filters[key] || ""}
          onChange={(event) => onChange({ ...filters, [key]: event.target.value })}
          className={selectClass}
        >
          <option value="">{t(key)}</option>
          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      ))}
      <button
        type="button"
        onClick={() => onChange({})}
        className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 sm:w-auto"
      >
        {t("clear")}
      </button>
    </div>
  );
}
