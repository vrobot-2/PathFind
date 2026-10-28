import { CloudOff, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className ?? ""}`} />;
}

/** Skeleton mirror of the dashboard grid, shown on first load. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading park operations">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Card key={index} className="space-y-3">
            <Block className="h-10 w-10 rounded-xl" />
            <Block className="h-2.5 w-24" />
            <Block className="h-8 w-20" />
            <Block className="h-2.5 w-32" />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padded={false} className="overflow-hidden lg:col-span-2">
          <div className="space-y-3 px-5 py-5">
            <Block className="h-2.5 w-28" />
            <Block className="h-3 w-52" />
          </div>
          <div className="h-[420px] animate-pulse border-t border-slate-200/70 bg-slate-100" />
        </Card>
        <Card className="space-y-4">
          <Block className="h-2.5 w-32" />
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <Block className="h-3 w-32" />
                <Block className="h-3 w-10" />
              </div>
              <Block className="h-1.5 w-full" />
            </div>
          ))}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 lg:col-span-2">
          <Block className="h-2.5 w-32" />
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex items-center gap-3">
              <Block className="h-9 w-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Block className="h-3 w-3/4" />
                <Block className="h-2.5 w-1/3" />
              </div>
              <Block className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </Card>
        <Card className="space-y-4">
          <Block className="h-2.5 w-24" />
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <Block className="h-3 flex-1" />
              <Block className="h-7 w-24 rounded-full" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

interface ErrorProps {
  message: string;
  onRetry: () => void;
}

/** Graceful outage state — the API is unreachable. */
export function DashboardError({ message, onRetry }: ErrorProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <CloudOff className="h-7 w-7" strokeWidth={2} />
      </span>
      <div className="max-w-md space-y-1.5">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Park telemetry is offline
        </h2>
        <p className="text-sm text-slate-600">
          We couldn&apos;t reach the live operations API. Check that the park server is running,
          then try again.
        </p>
        <p className="pt-1 text-xs font-medium text-rose-600">{message}</p>
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button variant="primary" size="md" onClick={onRetry}>
          <RotateCw className="h-4 w-4" strokeWidth={2.3} />
          Retry connection
        </Button>
      </motion.div>
    </Card>
  );
}
