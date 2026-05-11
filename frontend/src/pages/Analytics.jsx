import { useEffect, useState } from "react";
import { datasetApi } from "../services/api";
import Loading from "../components/Loading";
import AnalyticsCharts from "../components/AnalyticsCharts";
import FilterBar from "../components/FilterBar";
import { useLanguage } from "../context/LanguageContext";

export default function Analytics() {
  const { t } = useLanguage();
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    datasetApi
      .list()
      .then(({ data }) => {
        setDatasets(data.datasets);
        if (data.datasets[0]) setDatasetId(data.datasets[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    datasetApi
      .analytics(datasetId, filters)
      .then(({ data }) => setAnalysis(data))
      .finally(() => setLoading(false));
  }, [datasetId, filters]);

  if (loading && !analysis) return <Loading />;

  return (
    <div className="space-y-6">
      <section className="glass rounded-lg p-5">
        <label className="block max-w-md">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t("chooseDataset")}</span>
          <select className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-4 py-3" value={datasetId} onChange={(event) => setDatasetId(event.target.value)}>
            {datasets.map((dataset) => (
              <option key={dataset._id} value={dataset._id}>
                {dataset.name}
              </option>
            ))}
          </select>
        </label>
      </section>
      {analysis && (
        <>
          <FilterBar options={analysis.options} filters={filters} onChange={setFilters} />
          <AnalyticsCharts analytics={analysis.analytics} />
        </>
      )}
    </div>
  );
}
