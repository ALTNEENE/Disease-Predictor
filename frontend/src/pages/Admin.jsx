import { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import Loading from "../components/Loading";
import { dateTime } from "../utils/formatters";
import { useLanguage } from "../context/LanguageContext";

export default function Admin() {
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .overview()
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {Object.entries(data.counts || {}).map(([key, value]) => (
          <div key={key} className="glass rounded-lg p-5">
            <p className="text-sm text-slate-500">{t(key)}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="glass rounded-lg p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-950">{t("users")}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500 rtl:text-right">
                <th className="py-3 pe-4">{t("name")}</th>
                <th className="py-3 pe-4">{t("email")}</th>
                <th className="py-3 pe-4">{t("role")}</th>
                <th className="py-3 pe-4">{t("created")}</th>
              </tr>
            </thead>
            <tbody>
              {(data.users || []).map((user) => (
                <tr key={user._id} className="border-b border-slate-100">
                  <td className="py-3 pe-4 font-medium text-slate-900">{user.name}</td>
                  <td className="py-3 pe-4">{user.email}</td>
                  <td className="py-3 pe-4">{user.role === "admin" ? t("administrator") : t("analyst")}</td>
                  <td className="py-3 pe-4">{dateTime(user.createdAt, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
