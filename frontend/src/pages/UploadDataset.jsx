import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { datasetApi } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function UploadDataset() {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return;
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name || file.name);
    try {
      const { data } = await datasetApi.upload(formData);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || t("uploadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const columns = result?.analysis?.columns || [];
  const detected = result?.analysis?.detected_columns || {};

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="glass rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-3 text-teal-700">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">{t("upload")}</h2>
            <p className="text-sm text-slate-500">{t("supportedFormats")}</p>
          </div>
        </div>

        {error && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1.2fr_auto] md:items-end">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{t("datasetName")}</span>
            <input className="focus-ring w-full rounded-lg border border-slate-200 px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{t("excelFile")}</span>
            <input
              className="focus-ring w-full rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3"
              type="file"
              accept=".xls,.xlsx,.csv"
              onChange={(e) => setFile(e.target.files?.[0])}
              required
            />
          </label>
          <button className="focus-ring rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700" disabled={loading}>
            {loading ? t("uploading") : t("analyze")}
          </button>
        </div>
      </form>

      {result && (
        <section className="glass rounded-lg p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(detected).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{t(key)}</p>
                <p className="mt-2 font-semibold text-slate-900">{value || t("notDetected")}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500 rtl:text-right">
                  <th className="py-3 pe-4">{t("column")}</th>
                  <th className="py-3 pe-4">{t("type")}</th>
                  <th className="py-3 pe-4">{t("missing")}</th>
                  <th className="py-3 pe-4">{t("unique")}</th>
                  <th className="py-3 pe-4">{t("samples")}</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((column) => (
                  <tr key={column.name} className="border-b border-slate-100">
                    <td className="py-3 pe-4 font-medium text-slate-900">{column.name}</td>
                    <td className="py-3 pe-4">{column.type}</td>
                    <td className="py-3 pe-4">{column.missing}</td>
                    <td className="py-3 pe-4">{column.unique}</td>
                    <td className="py-3 pe-4 text-slate-500">{(column.sample_values || []).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
