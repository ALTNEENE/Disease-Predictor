export default function ChartCard({ title, children, actions }) {
  return (
    <section className="glass min-w-0 rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {actions}
      </div>
      <div className="h-64 min-w-0 sm:h-72">{children}</div>
    </section>
  );
}
