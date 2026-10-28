import {
  db,
  mapFeature,
  mapPark,
  mapReport,
  mapReview,
  mapTraffic,
  mapTrail,
  type ParkMetrics,
  type Report,
  type Review,
  type Trail,
} from "./db";

const PORT = 3001;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function readJsonBody(
  req: Request
): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (!text.trim()) return {};
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

const SURFACES = ["paved", "crushed-stone", "packed-dirt", "boardwalk", "rocky"];
const DIFFICULTIES = ["easy", "moderate", "hard"];
const TRAIL_STATUSES = ["open", "caution", "closed"];
const CATEGORIES = ["hazard", "scenic", "wildlife", "accessibility"];
const SEVERITIES = ["low", "medium", "high"];
const REPORT_STATUSES = ["open", "in-progress", "resolved"];

const pad = (n: number) => String(n).padStart(2, "0");

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getReports(status?: string | null): Report[] {
  const rows = status
    ? db
        .query("SELECT * FROM reports WHERE status = ? ORDER BY created_at DESC")
        .all(status)
    : db.query("SELECT * FROM reports ORDER BY created_at DESC").all();
  return (rows as Record<string, any>[]).map(mapReport);
}

function getTrail(id: string): Trail | null {
  const row = db.query("SELECT * FROM trails WHERE id = ?").get(id);
  return row ? mapTrail(row as Record<string, any>) : null;
}

function getReport(id: string): Report | null {
  const row = db.query("SELECT * FROM reports WHERE id = ?").get(id);
  return row ? mapReport(row as Record<string, any>) : null;
}

function getReviews(trailId?: string | null): Review[] {
  const rows = trailId
    ? db
        .query(
          "SELECT * FROM reviews WHERE trail_id = ? ORDER BY created_at DESC"
        )
        .all(trailId)
    : db.query("SELECT * FROM reviews ORDER BY created_at DESC").all();
  return (rows as Record<string, any>[]).map(mapReview);
}

function getReview(id: string): Review | null {
  const row = db.query("SELECT * FROM reviews WHERE id = ?").get(id);
  return row ? mapReview(row as Record<string, any>) : null;
}

function computeMetrics(): ParkMetrics {
  const now = new Date();
  const todayKey = localDateKey(now);

  const openHazardsRow = db
    .query(
      "SELECT COUNT(*) AS count FROM reports WHERE category = 'hazard' AND status = 'open'"
    )
    .get() as { count: number };

  const weekAgoIso = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const resolvedWeekRow = db
    .query(
      "SELECT COUNT(*) AS count FROM reports WHERE status = 'resolved' AND resolved_at IS NOT NULL AND resolved_at >= ?"
    )
    .get(weekAgoIso) as { count: number };

  const resolvedRows = db
    .query(
      "SELECT created_at, resolved_at FROM reports WHERE status = 'resolved' AND resolved_at IS NOT NULL"
    )
    .all() as { created_at: string; resolved_at: string }[];
  let avgResponseHrs = 1.8;
  if (resolvedRows.length > 0) {
    const total = resolvedRows.reduce((sum, row) => {
      const ms =
        new Date(row.resolved_at).getTime() -
        new Date(row.created_at).getTime();
      return sum + (Number.isFinite(ms) && ms > 0 ? ms / 3_600_000 : 0);
    }, 0);
    avgResponseHrs = Math.round((total / resolvedRows.length) * 10) / 10;
  }

  const visitsRow = db
    .query(
      "SELECT COALESCE(SUM(visit_count), 0) AS visits FROM traffic WHERE hour_bucket LIKE ?"
    )
    .get(`${todayKey}%`) as { visits: number };
  const visitsToday = visitsRow.visits;

  const accessibleRow = db
    .query(
      "SELECT COALESCE(SUM(distance_mi), 0) AS miles FROM trails WHERE wheelchair_ok = 1 AND status != 'closed'"
    )
    .get() as { miles: number };

  const bucketHour = Math.floor(now.getHours() / 3) * 3;
  const bucketKey = `${todayKey}T${pad(bucketHour)}:00`;
  const currentRow = db
    .query(
      "SELECT COALESCE(SUM(visit_count), 0) AS visits FROM traffic WHERE hour_bucket = ?"
    )
    .get(bucketKey) as { visits: number };

  let activeVisitors = Math.round(120 + currentRow.visits * 1.3);
  activeVisitors = Math.max(128, Math.min(420, activeVisitors));

  return {
    activeVisitors,
    openHazards: openHazardsRow.count,
    avgResponseHrs,
    resolvedThisWeek: resolvedWeekRow.count,
    visitsToday,
    accessibleTrailMi: Math.round(accessibleRow.miles * 10) / 10,
  };
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function isOneOf(value: unknown, allowed: string[]): value is string {
  return typeof value === "string" && allowed.includes(value);
}

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!path.startsWith("/api/")) {
    return json({ error: "not found" }, 404);
  }

  const segments = path
    .slice("/api/".length)
    .split("/")
    .filter((s) => s.length > 0)
    .map((s) => decodeURIComponent(s));

  if (method === "GET" && segments.length === 1 && segments[0] === "health") {
    return json({ ok: true });
  }

  if (method === "GET" && segments.length === 1 && segments[0] === "parks") {
    const rows = db.query("SELECT * FROM parks").all();
    return json((rows as Record<string, any>[]).map(mapPark));
  }

  if (segments[0] === "reviews") {
    if (method === "GET" && segments.length === 1) {
      const trailId = url.searchParams.get("trailId");
      return json(getReviews(trailId));
    }

    if (method === "POST" && segments.length === 1) {
      const body = await readJsonBody(req);
      if (body === null) return json({ error: "invalid JSON body" }, 400);

      const { trailId, author, rating, text } = body;

      if (typeof trailId !== "string" || trailId.trim().length === 0) {
        return json({ error: "trailId is required" }, 400);
      }
      if (!getTrail(trailId)) {
        return json({ error: "unknown trailId" }, 400);
      }
      if (
        typeof rating !== "number" ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        return json({ error: "rating must be an integer between 1 and 5" }, 400);
      }
      if (typeof text !== "string" || text.trim().length === 0) {
        return json({ error: "text is required" }, 400);
      }

      const id = `rev_${Math.random().toString(36).slice(2, 10)}`;
      const createdAt = new Date().toISOString();
      const authorName =
        typeof author === "string" && author.trim().length > 0
          ? author.trim()
          : "Anonymous";

      db.prepare(
        `INSERT INTO reviews (id, trail_id, author, rating, text, photo_url, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        trailId,
        authorName,
        rating,
        text.trim(),
        null,
        "Visitor review",
        createdAt
      );
      return json(getReview(id), 201);
    }

    return json({ error: "not found" }, 404);
  }

  if (segments[0] === "trails") {
    if (method === "GET" && segments.length === 1) {
      const rows = db.query("SELECT * FROM trails ORDER BY name").all();
      return json((rows as Record<string, any>[]).map(mapTrail));
    }
    if (method === "GET" && segments.length === 3 && segments[2] === "reviews") {
      const trail = getTrail(segments[1]);
      if (!trail) return json({ error: "not found" }, 404);
      return json(getReviews(trail.id));
    }
    if (method === "GET" && segments.length === 2) {
      const trail = getTrail(segments[1]);
      return trail ? json(trail) : json({ error: "not found" }, 404);
    }
    if (method === "PATCH" && segments.length === 2) {
      const existing = getTrail(segments[1]);
      if (!existing) return json({ error: "not found" }, 404);

      const body = await readJsonBody(req);
      if (body === null) return json({ error: "invalid JSON body" }, 400);

      const updates: string[] = [];
      const params: (string | number)[] = [];

      if ("status" in body) {
        if (!isOneOf(body.status, TRAIL_STATUSES)) {
          return json({ error: "invalid status" }, 400);
        }
        updates.push("status = ?");
        params.push(body.status);
      }
      if ("surface" in body) {
        if (!isOneOf(body.surface, SURFACES)) {
          return json({ error: "invalid surface" }, 400);
        }
        updates.push("surface = ?");
        params.push(body.surface);
      }
      if ("maxSlope" in body) {
        const value = parseFiniteNumber(body.maxSlope);
        if (value === null || value < 0 || value > 100) {
          return json({ error: "invalid maxSlope" }, 400);
        }
        updates.push("max_slope = ?");
        params.push(value);
      }
      if ("widthIn" in body) {
        const value = parseFiniteNumber(body.widthIn);
        if (value === null || value <= 0 || value > 200) {
          return json({ error: "invalid widthIn" }, 400);
        }
        updates.push("width_in = ?");
        params.push(value);
      }
      for (const [key, column] of [
        ["wheelchairOk", "wheelchair_ok"],
        ["bikeOk", "bike_ok"],
        ["walkerOk", "walker_ok"],
      ] as const) {
        if (key in body) {
          if (typeof body[key] !== "boolean") {
            return json({ error: `invalid ${key}` }, 400);
          }
          updates.push(`${column} = ?`);
          params.push(body[key] ? 1 : 0);
        }
      }

      if (updates.length > 0) {
        params.push(existing.id);
        db.prepare(
          `UPDATE trails SET ${updates.join(", ")} WHERE id = ?`
        ).run(...params);
      }
      return json(getTrail(existing.id));
    }
    return json({ error: "not found" }, 404);
  }

  if (method === "GET" && segments.length === 1 && segments[0] === "features") {
    const trailId = url.searchParams.get("trailId");
    const rows = trailId
      ? db
          .query("SELECT * FROM features WHERE trail_id = ?")
          .all(trailId)
      : db.query("SELECT * FROM features").all();
    return json((rows as Record<string, any>[]).map(mapFeature));
  }

  if (segments[0] === "reports") {
    if (method === "GET" && segments.length === 1) {
      const status = url.searchParams.get("status");
      if (status && !REPORT_STATUSES.includes(status)) {
        return json({ error: "invalid status filter" }, 400);
      }
      return json(getReports(status));
    }

    if (method === "POST" && segments.length === 1) {
      const body = await readJsonBody(req);
      if (body === null) return json({ error: "invalid JSON body" }, 400);

      const { trailId, category, severity, note } = body;
      const lat = parseFiniteNumber(body.lat);
      const lng = parseFiniteNumber(body.lng);

      if (typeof trailId !== "string" || trailId.length === 0) {
        return json({ error: "trailId is required" }, 400);
      }
      if (!getTrail(trailId)) {
        return json({ error: "unknown trailId" }, 400);
      }
      if (lat === null || lat < -90 || lat > 90) {
        return json({ error: "lat must be a number between -90 and 90" }, 400);
      }
      if (lng === null || lng < -180 || lng > 180) {
        return json({ error: "lng must be a number between -180 and 180" }, 400);
      }
      if (!isOneOf(category, CATEGORIES)) {
        return json({ error: "invalid category" }, 400);
      }
      if (!isOneOf(severity, SEVERITIES)) {
        return json({ error: "invalid severity" }, 400);
      }
      if (typeof note !== "string" || note.trim().length === 0) {
        return json({ error: "note is required" }, 400);
      }

      const id = `rep_${Math.random().toString(36).slice(2, 10)}`;
      const createdAt = new Date().toISOString();
      db.prepare(
        `INSERT INTO reports (id, trail_id, lat, lng, category, severity, note, photo_url,
           status, upvotes, ranger_note, created_at, resolved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        trailId,
        lat,
        lng,
        category,
        severity,
        note.trim(),
        null,
        "open",
        0,
        null,
        createdAt,
        null
      );
      return json(getReport(id), 201);
    }

    if (segments.length === 2) {
      const report = getReport(segments[1]);
      if (method === "PATCH") {
        if (!report) return json({ error: "not found" }, 404);
        const body = await readJsonBody(req);
        if (body === null) return json({ error: "invalid JSON body" }, 400);

        const updates: string[] = [];
        const params: (string | null)[] = [];

        if ("status" in body) {
          if (!isOneOf(body.status, REPORT_STATUSES)) {
            return json({ error: "invalid status" }, 400);
          }
          updates.push("status = ?");
          params.push(body.status);
          if (body.status === "resolved") {
            updates.push("resolved_at = ?");
            params.push(new Date().toISOString());
          }
        }
        if ("rangerNote" in body) {
          if (body.rangerNote !== null && typeof body.rangerNote !== "string") {
            return json({ error: "invalid rangerNote" }, 400);
          }
          updates.push("ranger_note = ?");
          params.push(body.rangerNote as string | null);
        }

        if (updates.length > 0) {
          params.push(report.id);
          db.prepare(
            `UPDATE reports SET ${updates.join(", ")} WHERE id = ?`
          ).run(...params);
        }
        return json(getReport(report.id));
      }
      return json({ error: "not found" }, 404);
    }

    if (method === "POST" && segments.length === 3 && segments[2] === "upvote") {
      const report = getReport(segments[1]);
      if (!report) return json({ error: "not found" }, 404);
      db.prepare("UPDATE reports SET upvotes = upvotes + 1 WHERE id = ?").run(
        report.id
      );
      return json(getReport(report.id));
    }

    return json({ error: "not found" }, 404);
  }

  if (method === "GET" && segments.length === 1 && segments[0] === "traffic") {
    const rows = db.query("SELECT * FROM traffic ORDER BY hour_bucket, trail_id").all();
    return json((rows as Record<string, any>[]).map(mapTraffic));
  }

  if (method === "GET" && segments.length === 1 && segments[0] === "metrics") {
    return json(computeMetrics());
  }

  return json({ error: "not found" }, 404);
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    try {
      return await handle(req);
    } catch (error) {
      console.error("Request failed:", error);
      return json({ error: "internal server error" }, 500);
    }
  },
});

console.log(`PAthFind API listening on http://localhost:${server.port}`);
