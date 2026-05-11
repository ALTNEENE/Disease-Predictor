import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[18rem_minmax(0,1fr)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 overflow-x-hidden">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
