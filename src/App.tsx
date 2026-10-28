import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import AppNavbar from "./features/map/AppNavbar";
import HomePage from "./features/home/HomePage";
import MapPage from "./features/map/MapPage";
import DashboardPage from "./features/admin/dashboard/DashboardPage";
import TriagePage from "./features/admin/tables/TriagePage";
import AboutPage from "./features/info/AboutPage";
import DemoMode from "./features/demo/DemoMode";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/reports" element={<TriagePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </AnimatePresence>
      <DemoMode />
    </div>
  );
}
