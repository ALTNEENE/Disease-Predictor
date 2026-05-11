import { useEffect, useMemo, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { datasetApi, modelApi } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import Loading from "../components/Loading";
import { metricValue } from "../utils/formatters";

export default function TrainModel() {
  const { t } = useLanguage();
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState({ datasetId: "", name: "", targetDisease: "", targetCases: "", targetDeaths: "" });
  const [tree, setTree] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([datasetApi.list(), modelApi.list()])
      .then(([datasetRes, modelRes]) => {
        setDatasets(datasetRes.data.datasets);
        setModels(modelRes.data.models);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedDataset = useMemo(() => datasets.find((item) => item._id === form.datasetId), [datasets, form.datasetId]);
  const columns = selectedDataset?.columnSummary || [];

  useEffect(() => {
    if (selectedDataset) {
      setForm((current) => ({
        ...current,
        targetDisease: selectedDataset.detectedColumns?.disease || "",
        targetCases: selectedDataset.detectedColumns?.cases || "",
        targetDeaths: selectedDataset.detectedColumns?.deaths || ""
      }));
    }
  }, [selectedDataset]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setTraining(true);
    setTree(null);
    try {
      const { data } = await modelApi.train(form);
      setResult(data.modelRun);
      const refreshed = await modelApi.list();
      setModels(refreshed.data.models);
    } catch (err) {
      setError(err.response?.data?.message || t("trainingFailed"));
    } finally {
      setTraining(false);
    }
  };

  const loadTree = async (modelId) => {
    const { data } = await modelApi.tree(modelId);
    setTree(data);
  };

  if (loading) return <Loading />;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <form onSubmit={submit} className="glass rounded-lg p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t("trainDecisionTree")}</h2>
            <p className="text-sm text-slate-500">{t("trainIntro")}</p>
          </div>
        </div>

        {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{t("chooseDataset")}</span>
            <select
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-4 py-3"
              value={form.datasetId}
              onChange={(event) => setForm({ ...form, datasetId: event.target.value })}
              required
            >
              <option value="">{t("select")}</option>
              {datasets.map((dataset) => (
                <option key={dataset._id} value={dataset._id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{t("modelName")}</span>
            <input className="focus-ring w-full rounded-lg border border-slate-200 px-4 py-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["targetDisease", "diseaseTarget"],
              ["targetCases", "casesTarget"],
              ["targetDeaths", "deathsTarget"]
            ].map(([key, labelKey]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">{t(labelKey)}</span>
                <select className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-3" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                  <option value="">{t("auto")}</option>
                  {columns.map((column) => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        <button className="focus-ring mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 sm:w-auto" disabled={training || !form.datasetId}>
          {training ? t("training") : t("trainDecisionTree")}
        </button>

        {result && (
          <div className="mt-6 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
            {t("trainedModel")}: <strong>{result.name}</strong>
          </div>
        )}
      </form>

      <section className="glass rounded-lg p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-950">{t("modelRuns")}</h2>
        <div className="space-y-4">
          {models.map((model) => (
            <div key={model._id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{model.name}</p>
                  <p className="text-xs text-slate-500">{model.mlModelId}</p>
                </div>
                <button className="focus-ring rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700" onClick={() => loadTree(model._id)}>
                  {t("tree")}
                </button>
              </div>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <span>{t("accuracy")}: {metricValue(model.metrics?.classification?.accuracy)}</span>
                <span>{t("f1")}: {metricValue(model.metrics?.classification?.f1)}</span>
                <span>{t("casesMae")}: {metricValue(model.metrics?.cases?.mae)}</span>
                <span>{t("deathsMae")}: {metricValue(model.metrics?.deaths?.mae)}</span>
              </div>
            </div>
          ))}
        </div>
        {tree && (
          <pre dir="ltr" className="mt-5 max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-left text-xs text-teal-100">
            {Object.entries(tree.trees || {})
              .map(([name, value]) => `${name}\n${value.text}`)
              .join("\n\n")}
          </pre>
        )}
      </section>
    </div>
  );
}
