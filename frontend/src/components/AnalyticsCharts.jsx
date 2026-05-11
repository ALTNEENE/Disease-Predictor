import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ChartCard from "./ChartCard";
import { useLanguage } from "../context/LanguageContext";

const colors = ["#0d9488", "#2563eb", "#e11d48", "#f59e0b", "#7c3aed", "#16a34a", "#0891b2"];

function EmptyChart({ label }) {
  return <div className="grid h-full place-items-center text-sm text-slate-400">{label}</div>;
}

export default function AnalyticsCharts({ analytics = {} }) {
  const { t } = useLanguage();
  const disease = analytics.disease_distribution || [];
  const monthly = analytics.monthly_trends || [];
  const weather = analytics.weather_correlation || [];
  const states = analytics.state_comparison || [];
  const gender = analytics.gender_analysis || [];
  const age = analytics.age_group_analysis || [];
  const mortality = analytics.mortality_analysis || [];

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard title={t("diseaseDistribution")}>
        {disease.length ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie data={disease} dataKey="cases" nameKey="label" innerRadius={62} outerRadius={95} paddingAngle={3}>
                {disease.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label={t("noChartData")} />
        )}
      </ChartCard>

      <ChartCard title={t("monthlyTrends")}>
        {monthly.length ? (
          <ResponsiveContainer>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cases" stroke="#0d9488" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label={t("noChartData")} />
        )}
      </ChartCard>

      <ChartCard title={t("weatherCorrelation")}>
        {weather.length ? (
          <ResponsiveContainer>
            <BarChart data={weather}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cases" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label={t("noChartData")} />
        )}
      </ChartCard>

      <ChartCard title={t("stateComparison")}>
        {states.length ? (
          <ResponsiveContainer>
            <BarChart data={states}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cases" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label={t("noChartData")} />
        )}
      </ChartCard>

      <ChartCard title={t("genderAnalysis")}>
        {gender.length ? (
          <ResponsiveContainer>
            <BarChart data={gender}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cases" fill="#e11d48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label={t("noChartData")} />
        )}
      </ChartCard>

      <ChartCard title={t("ageAnalysis")}>
        {age.length ? (
          <ResponsiveContainer>
            <BarChart data={age}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cases" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label={t("noChartData")} />
        )}
      </ChartCard>

      <ChartCard title={t("mortality")}>
        {mortality.length ? (
          <ResponsiveContainer>
            <BarChart data={mortality}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mortality_rate" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label={t("noChartData")} />
        )}
      </ChartCard>
    </div>
  );
}
