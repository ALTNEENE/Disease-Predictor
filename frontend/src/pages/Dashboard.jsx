import { useEffect, useState } from "react";
import { BrainCircuit, Database, TableProperties, Users } from "lucide-react";
import { dashboardApi } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import AnalyticsCharts from "../components/AnalyticsCharts";
import FilterBar from "../components/FilterBar";

export default function Dashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .stats(filters)
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading) return <Loading />;

  const overview = data?.overview || {};
  const analysis = data?.analysis;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={t("datasets")} value={overview.datasets} icon={Database} delay={0} />
        <StatCard title={t("models")} value={overview.models} icon={BrainCircuit} tone="blue" delay={70} />
        <StatCard title={t("users")} value={overview.users} icon={Users} tone="rose" delay={140} />
        <StatCard title={t("rows")} value={overview.rows} icon={TableProperties} tone="amber" delay={210} />
      </div>

      {!analysis ? (
        <EmptyState description={t("uploadEmpty")} />
      ) : (
        <>
          <FilterBar options={analysis.options} filters={filters} onChange={setFilters} />
          <AnalyticsCharts analytics={analysis.analytics} />
        </>
      )}
    </div>
  );
}
