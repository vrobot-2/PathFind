import { motion } from "framer-motion";
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
      {/*
        Page transition: a keyed enter animation. Keeping AnimatePresence in
        mode="wait" here left the outgoing page mounted indefinitely when the
        route changed from a timer (e.g. the auto-playing demo), so the URL
        changed but the old screen stayed on top. Keying the wrapper swaps the
        screen immediately and animates the new one in.
      */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/reports" element={<TriagePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </motion.div>
      <DemoMode />
    </div>
  );
}
