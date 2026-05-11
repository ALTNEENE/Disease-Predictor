import { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { modelApi } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import Loading from "../components/Loading";

export default function Predict() {
  const { language, t } = useLanguage();
  const [models, setModels] = useState([]);
  const [modelRunId, setModelRunId] = useState("");
  const [features, setFeatures] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    modelApi
      .list()
      .then(({ data }) => setModels(data.models))
      .finally(() => setLoading(false));
  }, []);

  const selectedModel = useMemo(() => models.find((model) => model._id === modelRunId), [models, modelRunId]);
  const featureColumns = selectedModel?.rawFeatureColumns?.length ? selectedModel.rawFeatureColumns : selectedModel?.featureColumns || [];

  useEffect(() => {
    const next = {};
    featureColumns.forEach((column) => {
      next[column] = features[column] || "";
    });
    setFeatures(next);
  }, [modelRunId]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const cleanedFeatures = Object.fromEntries(
      Object.entries(features)
        .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
        .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    );
    try {
      const { data } = await modelApi.predict({ modelRunId, features: cleanedFeatures });
      setPrediction(data.prediction);
    } catch (err) {
      setError(err.response?.data?.message || t("predictionFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  const riskKey = prediction?.risk_level ? `risk${prediction.risk_level.charAt(0).toUpperCase()}${prediction.risk_level.slice(1).toLowerCase()}` : null;
  const recommendations = prediction?.recommendations?.[language] || prediction?.recommendations?.en || [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <form onSubmit={submit} className="glass rounded-lg p-4 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-3 text-teal-700">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t("predict")}</h2>
            <p className="text-sm text-slate-500">{t("predictIntro")}</p>
          </div>
        </div>

        {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t("chooseModel")}</span>
          <select
            className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-4 py-3"
            value={modelRunId}
            onChange={(event) => setModelRunId(event.target.value)}
            required
          >
            <option value="">{t("select")}</option>
            {models.map((model) => (
              <option key={model._id} value={model._id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {featureColumns.map((column) => (
            <label key={column} className="block">
              <span className="mb-1 block truncate text-sm font-medium text-slate-700">{column}</span>
              <input
                className="focus-ring w-full rounded-lg border border-slate-200 px-4 py-3"
                value={features[column] || ""}
                onChange={(event) => setFeatures({ ...features, [column]: event.target.value })}
              />
            </label>
          ))}
        </div>

        <button className="focus-ring mt-6 w-full rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 sm:w-auto" disabled={submitting || !modelRunId}>
          {submitting ? t("predicting") : t("runPrediction")}
        </button>
      </form>

      <section className="glass rounded-lg p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-950">{t("result")}</h2>
        {!prediction ? (
          <p className="text-sm text-slate-500">{t("predictionHint")}</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">{t("riskLevel")}</p>
              <p className="mt-2 text-3xl font-bold">{riskKey ? t(riskKey) : "-"}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{t("disease")}</p>
                <p className="mt-2 font-semibold text-slate-950">{prediction.disease_type || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{t("expectedCases")}</p>
                <p className="mt-2 font-semibold text-slate-950">{prediction.expected_cases ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{t("expectedDeaths")}</p>
                <p className="mt-2 font-semibold text-slate-950">{prediction.expected_deaths ?? "-"}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-950">{t("recommendations")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {recommendations.map((item) => (
                  <li key={item} className="rounded-lg bg-white px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
