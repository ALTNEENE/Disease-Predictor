import { useEffect, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { datasetApi, modelApi, reportApi } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import Loading from "../components/Loading";

export default function Reports() {
  const { t } = useLanguage();
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState({ datasetId: "", modelRunId: "", title: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([datasetApi.list(), modelApi.list()])
      .then(([datasetRes, modelRes]) => {
        setDatasets(datasetRes.data.datasets);
        setModels(modelRes.data.models);
        if (datasetRes.data.datasets[0]) setForm((current) => ({ ...current, datasetId: datasetRes.data.datasets[0]._id }));
      })
      .finally(() => setLoading(false));
  }, []);

  const datasetModels = useMemo(() => models.filter((model) => !form.datasetId || model.dataset?._id === form.datasetId), [models, form.datasetId]);

  const submit = async (event) => {
    event.preventDefault();
    setExporting(true);
    try {
      const { data } = await reportApi.export(form);
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "disease-report.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <form onSubmit={submit} className="glass max-w-3xl rounded-lg p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-rose-100 p-3 text-rose-700">
          <FileDown className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-950">{t("reports")}</h2>
          <p className="text-sm text-slate-500">{t("reportIntro")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t("title")}</span>
          <input className="focus-ring w-full rounded-lg border border-slate-200 px-4 py-3" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t("chooseDataset")}</span>
          <select className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-4 py-3" value={form.datasetId} onChange={(event) => setForm({ ...form, datasetId: event.target.value })} required>
            {datasets.map((dataset) => (
              <option key={dataset._id} value={dataset._id}>
                {dataset.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t("chooseModel")}</span>
          <select className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-4 py-3" value={form.modelRunId} onChange={(event) => setForm({ ...form, modelRunId: event.target.value })}>
            <option value="">{t("noModel")}</option>
            {datasetModels.map((model) => (
              <option key={model._id} value={model._id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button className="focus-ring mt-6 w-full rounded-lg bg-rose-600 px-5 py-3 font-semibold text-white hover:bg-rose-700 sm:w-auto" disabled={exporting || !form.datasetId}>
        {exporting ? t("exporting") : t("exportPdf")}
      </button>
    </form>
  );
}
