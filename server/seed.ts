import { Database } from "bun:sqlite";
import { DB_PATH, DROP_SQL, SCHEMA_SQL } from "./schema";

type LatLng = [number, number];

type TrailSeed = {
  id: string;
  parkId: string;
  name: string;
  description: string;
  distanceMi: number;
  elevationFt: number;
  surface: string;
  maxSlope: number;
  widthIn: number;
  difficulty: string;
  walkerOk: boolean;
  bikeOk: boolean;
  wheelchairOk: boolean;
  status: string;
  geometry: LatLng[];
  photoUrl: string;
  loop: boolean;
};

type FeatureSeed = {
  id: string;
  trailId: string;
  lat: number;
  lng: number;
  type: string;
  title: string;
  description: string;
  alertText: string;
};

type ReportSeed = {
  trailId: string;
  pt: number;
  dLat: number;
  dLng: number;
  category: string;
  severity: string;
  note: string;
  status: string;
  upvotes: number;
  hoursAgo: number;
  rangerNote?: string;
  responseHrs?: number;
};

type ReviewSeed = {
  trailId: string;
  author: string;
  rating: number;
  text: string;
  photoUrl: string | null;
  source: string;
  daysAgo: number;
};

const PARK = {
  id: "marsh-creek",
  name: "Marsh Creek State Park",
  region: "Chester County, PA",
  centerLat: 40.0745,
  centerLng: -75.7779,
  zoom: 14,
  acreage: 1730,
};

/**
 * Eight official Marsh Creek trails. Names, distances, blazes, route types and
 * difficulty ratings come from the DCNR park guide/map (2021) and current DCNR
 * hiking page. Geometry is a demo-frame interpretation of the official map
 * (see docs/park-research.md); only Park Road Trail is step-free.
 */
const TRAILS: TrailSeed[] = [
  {
    id: "white-trail",
    parkId: PARK.id,
    name: "White Trail",
    description:
      "Official 4.0-mile out-and-back and the easiest hiking route on the west side. From the West Launch it follows the lakeshore, rolls through the agricultural fields and horse-barn area, and reaches the dam. Wide, largely gentle tread with a few short climbs.",
    distanceMi: 4.0,
    elevationFt: 430,
    surface: "packed-dirt",
    maxSlope: 5.0,
    widthIn: 72,
    difficulty: "easy",
    walkerOk: true,
    bikeOk: true,
    wheelchairOk: false,
    status: "open",
    geometry: [
      [40.0626, -75.7828],
      [40.0655, -75.7868],
      [40.0685, -75.788],
      [40.07, -75.7895],
      [40.069, -75.792],
      [40.065, -75.7925],
      [40.061, -75.791],
      [40.058, -75.7875],
      [40.056, -75.7825],
      [40.055, -75.778],
    ],
    photoUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
    loop: false,
  },
  {
    id: "blue-trail",
    parkId: PARK.id,
    name: "Blue Trail",
    description:
      "Official 3.5-mile loop with blue blazes, rated more difficult. Mostly wooded and wide enough for horses, it passes historic ruins and follows the East Branch of the Brandywine Creek on the park's west edge.",
    distanceMi: 3.5,
    elevationFt: 520,
    surface: "packed-dirt",
    maxSlope: 10.0,
    widthIn: 96,
    difficulty: "moderate",
    walkerOk: true,
    bikeOk: true,
    wheelchairOk: false,
    status: "open",
    geometry: [
      [40.0626, -75.7828],
      [40.0645, -75.7885],
      [40.0675, -75.794],
      [40.072, -75.7985],
      [40.077, -75.801],
      [40.082, -75.7995],
      [40.0855, -75.7955],
      [40.0845, -75.795],
      [40.08, -75.795],
      [40.074, -75.797],
      [40.068, -75.789],
      [40.0626, -75.7828],
    ],
    photoUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    loop: true,
  },
  {
    id: "lakeside-accessible-loop",
    parkId: PARK.id,
    name: "Lakeside Accessible Loop",
    description:
      "A wide paved and boardwalk loop that circles the northern lobe of the lake. Benches and shade structures sit at regular intervals, the grades stay gentle, and the boardwalk section over the narrow neck gives open water views in both directions. Built for wheelchairs, strollers and walkers, and open to bikes.",
    distanceMi: 1.6,
    elevationFt: 40,
    surface: "paved",
    maxSlope: 2.0,
    widthIn: 60,
    difficulty: "easy",
    walkerOk: true,
    bikeOk: true,
    wheelchairOk: true,
    status: "open",
    geometry: [
      [40.0902, -75.7907],
      [40.092, -75.7913],
      [40.0935, -75.7929],
      [40.0942, -75.7954],
      [40.0938, -75.7978],
      [40.0926, -75.7994],
      [40.0908, -75.8003],
      [40.089, -75.7998],
      [40.0876, -75.798],
      [40.0869, -75.7958],
      [40.0872, -75.7933],
      [40.0886, -75.7914],
    ],
    photoUrl:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    loop: true,
  },
  {
    id: "lime-loop",
    parkId: PARK.id,
    name: "Lime Loop",
    description:
      "Official 1.8-mile loop with lime blazes, rated more difficult. The loop branches off the Blue Trail in the northwestern part of the park and is a local favorite for mountain biking and horseback riding.",
    distanceMi: 1.8,
    elevationFt: 540,
    surface: "packed-dirt",
    maxSlope: 11.0,
    widthIn: 48,
    difficulty: "moderate",
    walkerOk: true,
    bikeOk: true,
    wheelchairOk: false,
    status: "open",
    geometry: [
      [40.077, -75.797],
      [40.0785, -75.8008],
      [40.0812, -75.8038],
      [40.0842, -75.8028],
      [40.0852, -75.7985],
      [40.084, -75.7945],
      [40.08, -75.7938],
      [40.077, -75.797],
    ],
    photoUrl:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    loop: true,
  },
  {
    id: "mansion-trails",
    parkId: PARK.id,
    name: "Mansion Trails",
    description:
      "Official 0.9-mile connector with white/blue blazes, rated easiest. Stone foundations and other remnants of the village of Milford Mills, flooded when the reservoir filled, sit beside the path.",
    distanceMi: 0.9,
    elevationFt: 380,
    surface: "packed-dirt",
    maxSlope: 4.0,
    widthIn: 48,
    difficulty: "easy",
    walkerOk: true,
    bikeOk: true,
    wheelchairOk: false,
    status: "open",
    geometry: [
      [40.06, -75.784],
      [40.0608, -75.787],
      [40.0625, -75.788],
      [40.064, -75.786],
      [40.0635, -75.7835],
      [40.0618, -75.7825],
      [40.06, -75.784],
    ],
    photoUrl:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80",
    loop: false,
  },
  {
    id: "park-road-trail",
    parkId: PARK.id,
    name: "Park Road Trail",
    description:
      "Official 0.6-mile out-and-back, rated easiest and the park's ADA route. The paved path runs from the boat-rental parking area past the warm-season grass fields to the accessible fishing pier at the East Launch.",
    distanceMi: 0.6,
    elevationFt: 365,
    surface: "paved",
    maxSlope: 2.0,
    widthIn: 72,
    difficulty: "easy",
    walkerOk: true,
    bikeOk: true,
    wheelchairOk: true,
    status: "open",
    geometry: [
      [40.0682, -75.7708],
      [40.0686, -75.769],
      [40.0685, -75.7678],
      [40.0682, -75.7668],
      [40.0674, -75.7645],
    ],
    photoUrl:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80",
    loop: false,
  },
  {
    id: "red-trail",
    parkId: PARK.id,
    name: "Red Trail",
    description:
      "Official 1.5-mile loop with red blazes, rated more difficult and open to hiking only. It is the east-side trail, running along the lake and through woods between the day-use areas and the East Launch.",
    distanceMi: 1.5,
    elevationFt: 410,
    surface: "packed-dirt",
    maxSlope: 9.0,
    widthIn: 42,
    difficulty: "moderate",
    walkerOk: true,
    bikeOk: false,
    wheelchairOk: false,
    status: "open",
    geometry: [
      [40.0675, -75.7695],
      [40.0688, -75.766],
      [40.0688, -75.7625],
      [40.067, -75.758],
      [40.0645, -75.759],
      [40.062, -75.761],
      [40.0612, -75.764],
      [40.063, -75.7668],
      [40.0652, -75.7688],
      [40.0675, -75.7695],
    ],
    photoUrl:
      "https://images.unsplash.com/photo-1486365227551-f3f90034a57c?w=800&q=80",
    loop: true,
  },
  {
    id: "yellow-trail",
    parkId: PARK.id,
    name: "Yellow Trail",
    description:
      "Official 6.2-mile out-and-back with yellow blazes, rated most difficult. It starts at the Dorlan Mill Road parking area and threads the mountain-bike loops south and east of the dam, with steep pitches, roots and rock.",
    distanceMi: 6.2,
    elevationFt: 500,
    surface: "rocky",
    maxSlope: 16.0,
    widthIn: 36,
    difficulty: "hard",
    walkerOk: true,
    bikeOk: true,
    wheelchairOk: false,
    status: "caution",
    geometry: [
      [40.052, -75.762],
      [40.0512, -75.7575],
      [40.0495, -75.753],
      [40.0478, -75.748],
      [40.0465, -75.743],
      [40.0472, -75.739],
      [40.0498, -75.7375],
      [40.052, -75.741],
      [40.0538, -75.746],
      [40.0528, -75.7555],
      [40.0512, -75.759],
      [40.052, -75.762],
    ],
    photoUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    loop: false,
  },
];

const FEATURES: FeatureSeed[] = [
  {
    id: "feat_01",
    trailId: "white-trail",
    lat: 40.0628,
    lng: -75.7835,
    type: "scenic",
    title: "West Launch Lake Vista",
    description:
      "Open view across the main basin from the west boat launch, with the north arm stretching away to the left and the dam far to the southeast.",
    alertText: "Look left — the lake opens up beyond the launch",
  },
  {
    id: "feat_02",
    trailId: "white-trail",
    lat: 40.0553,
    lng: -75.7605,
    type: "scenic",
    title: "Marsh Creek Dam Overlook",
    description:
      "The 90-foot-high, 990-foot-long earth-and-rock fill dam closes the south end of the lake. The dam was built between 1970 and 1973.",
    alertText: "Ahead — the 990-foot dam holding back 535 acres of water",
  },
  {
    id: "feat_03",
    trailId: "blue-trail",
    lat: 40.089,
    lng: -75.7898,
    type: "scenic",
    title: "North Arm Overlook",
    description:
      "The reservoir narrows into a winding north arm here, with drowned timber and quiet backwater habitat toward Little Conestoga Road.",
    alertText: "Look left — the north arm winds away toward the woods",
  },
  {
    id: "feat_04",
    trailId: "red-trail",
    lat: 40.068,
    lng: -75.77,
    type: "scenic",
    title: "East Launch Marina View",
    description:
      "Sailboats, rental craft and seasonal mooring slips fill the east basin beside the boat rental and snack bar.",
    alertText: "Marina ahead — watch for sailboats crossing the basin",
  },
  {
    id: "feat_05",
    trailId: "mansion-trails",
    lat: 40.0605,
    lng: -75.785,
    type: "historic",
    title: "Milford Mills Ruins",
    description:
      "Stone foundations and cellar holes mark the village of Milford Mills, the only settlement inside the area flooded for the reservoir.",
    alertText: "Historic stone foundations on your left — Milford Mills",
  },
  {
    id: "feat_06",
    trailId: "mansion-trails",
    lat: 40.0615,
    lng: -75.786,
    type: "historic",
    title: "Murphy Mansion Site",
    description:
      "Mike Murphy's 168-acre racehorse estate, including a 44-room mansion, once formed almost the whole village. The buildings were demolished during park development.",
    alertText: "Murphy Mansion site — a 44-room house stood here",
  },
  {
    id: "feat_07",
    trailId: "white-trail",
    lat: 40.0575,
    lng: -75.779,
    type: "historic",
    title: "Larkin Covered Bridge Site",
    description:
      "An 1854 covered bridge once spanned Marsh Creek at Milford Mills. It was moved to an Upper Uwchlan Township trail before the valley was flooded.",
    alertText: "The 1854 Larkin covered bridge once crossed here",
  },
  {
    id: "feat_08",
    trailId: "white-trail",
    lat: 40.0548,
    lng: -75.7615,
    type: "historic",
    title: "Dam Construction Interpretive Site",
    description:
      "Construction ran from May 1970 to June 1973. The gates closed on November 16, 1973, and the lake reached normal pool on June 21, 1974.",
    alertText: "1970s dam works — the gates closed in November 1973",
  },
  {
    id: "feat_09",
    trailId: "blue-trail",
    lat: 40.087,
    lng: -75.786,
    type: "wildlife",
    title: "Heron Rookery",
    description:
      "Drowned snags in the quiet north arm give herons and other wading birds a sheltered nesting and feeding area in spring.",
    alertText: "Heron rookery on the north arm — quiet please",
  },
  {
    id: "feat_10",
    trailId: "red-trail",
    lat: 40.0728,
    lng: -75.77,
    type: "wildlife",
    title: "Osprey Platform",
    description:
      "Ospreys are regular spring and fall migrants over the lake and rebuild stick nests on platform poles near the east shore.",
    alertText: "Osprey platform ahead — look up and scan the sky",
  },
  {
    id: "feat_11",
    trailId: "lime-loop",
    lat: 40.0805,
    lng: -75.78,
    type: "wildlife",
    title: "Bald Eagle Perch",
    description:
      "Bald eagles patrol the open water here, especially in winter when migrating waterfowl concentrate on the lake.",
    alertText: "Bald eagle often perches in the tall oak on the point",
  },
  {
    id: "feat_12",
    trailId: "red-trail",
    lat: 40.067,
    lng: -75.759,
    type: "wildlife",
    title: "Turtle Basking Platforms",
    description:
      "The lake's artificial fish-habitat program includes turtle basking platforms; painted and snapping turtles haul out on warm afternoons.",
    alertText: "Count the turtles on the basking platforms",
  },
  {
    id: "feat_13",
    trailId: "white-trail",
    lat: 40.0688,
    lng: -75.788,
    type: "wildlife",
    title: "Grassland Bird Meadow",
    description:
      "Warm-season grasses of Indian grass, big and little bluestem and switchgrass shelter bobolinks, meadowlarks, savannah sparrows and northern harriers.",
    alertText: "Listen — bobolinks and meadowlarks nest in this grass",
  },
  {
    id: "feat_14",
    trailId: "red-trail",
    lat: 40.06,
    lng: -75.7705,
    type: "wildlife",
    title: "Wood Duck Cove",
    description:
      "A sheltered cove off the east basin where wood ducks, mallards and spring migrants loaf in the flooded brush.",
    alertText: "Quiet cove on the right — wood ducks frequent the brush",
  },
  {
    id: "feat_15",
    trailId: "yellow-trail",
    lat: 40.055,
    lng: -75.7575,
    type: "water",
    title: "Dam Spillway",
    description:
      "The concrete spillway carries releases around the earth-fill dam into Marsh Creek and the East Branch Brandywine downstream.",
    alertText: "Look left — the 1971 dam spillway",
  },
  {
    id: "feat_16",
    trailId: "blue-trail",
    lat: 40.078,
    lng: -75.802,
    type: "water",
    title: "East Branch Brandywine",
    description:
      "The East Branch of the Brandywine Creek threads the western woods and feeds the reservoir; the Blue Trail follows its bank.",
    alertText: "Creek crossing ahead — the East Branch of the Brandywine",
  },
  {
    id: "feat_17",
    trailId: "park-road-trail",
    lat: 40.0674,
    lng: -75.7645,
    type: "water",
    title: "ADA Fishing Pier",
    description:
      "The accessible fishing pier at the East Launch has ADA parking nearby and is the destination of the paved Park Road Trail.",
    alertText: "Accessible fishing pier ahead — level paved approach",
  },
  {
    id: "feat_18",
    trailId: "white-trail",
    lat: 40.061,
    lng: -75.7845,
    type: "photo",
    title: "Sunset Point",
    description:
      "A west-shore opening with an unobstructed sightline down the lake toward the dam — the park's classic evening photograph.",
    alertText: "Sunset Point — arrive 30 minutes before dusk",
  },
  {
    id: "feat_19",
    trailId: "lakeside-accessible-loop",
    lat: 40.0908,
    lng: -75.8003,
    type: "scenic",
    title: "North Arm Boardwalk",
    description:
      "The widest boardwalk section on the accessible loop, with knee-high railings, passing bays and two benches looking down the north arm.",
    alertText: "Boardwalk ahead — benches and open water on both sides",
  },
];

const REPORTS: ReportSeed[] = [
  // ---- open / hazard (10) ----
  { trailId: "blue-trail", pt: 4, dLat: 0.0002, dLng: 0.0002, category: "hazard", severity: "high", note: "Large oak down across the trail near the Brandywine crossing", status: "open", upvotes: 26, hoursAgo: 3 },
  { trailId: "yellow-trail", pt: 7, dLat: -0.0002, dLng: 0.0002, category: "hazard", severity: "high", note: "Deep erosion rut with an 18-inch drop-off on the upper MTB loop", status: "open", upvotes: 21, hoursAgo: 5 },
  { trailId: "red-trail", pt: 3, dLat: 0.0002, dLng: 0.0001, category: "hazard", severity: "medium", note: "Fallen branch blocking half the lakeside tread", status: "open", upvotes: 15, hoursAgo: 9 },
  { trailId: "white-trail", pt: 7, dLat: -0.0002, dLng: 0.0002, category: "hazard", severity: "medium", note: "Muddy seep across 40 ft of trail at the field edge", status: "open", upvotes: 12, hoursAgo: 14 },
  { trailId: "lime-loop", pt: 2, dLat: 0.0002, dLng: -0.0002, category: "hazard", severity: "medium", note: "Loose rock washed onto the switchback", status: "open", upvotes: 10, hoursAgo: 20 },
  { trailId: "mansion-trails", pt: 2, dLat: 0.0002, dLng: 0.0002, category: "hazard", severity: "low", note: "Crumbling mortar at the Milford Mills foundation edge", status: "open", upvotes: 6, hoursAgo: 27 },
  { trailId: "park-road-trail", pt: 2, dLat: 0.0001, dLng: 0.0001, category: "hazard", severity: "high", note: "Standing water floods the paved path at the low spot", status: "open", upvotes: 19, hoursAgo: 2 },
  { trailId: "lakeside-accessible-loop", pt: 3, dLat: 0.0001, dLng: 0.0001, category: "accessibility", severity: "low", note: "Boardwalk railing loose at the north bench", status: "open", upvotes: 7, hoursAgo: 12 },
  { trailId: "blue-trail", pt: 7, dLat: 0.0002, dLng: -0.0002, category: "hazard", severity: "low", note: "Horse traffic has deepened ruts after rain", status: "open", upvotes: 8, hoursAgo: 46 },
  { trailId: "yellow-trail", pt: 9, dLat: -0.0002, dLng: 0.0002, category: "hazard", severity: "high", note: "Dead ash leaning over the trail after wind", status: "open", upvotes: 17, hoursAgo: 16 },

  // ---- open / other categories (5) ----
  { trailId: "blue-trail", pt: 2, dLat: 0.0002, dLng: 0.0002, category: "scenic", severity: "low", note: "Peak fall color along the Brandywine bend", status: "open", upvotes: 22, hoursAgo: 7 },
  { trailId: "red-trail", pt: 5, dLat: -0.0002, dLng: 0.0002, category: "wildlife", severity: "low", note: "Bald eagle hunting over the east basin", status: "open", upvotes: 14, hoursAgo: 25 },
  { trailId: "park-road-trail", pt: 3, dLat: 0.0001, dLng: 0.0001, category: "accessibility", severity: "medium", note: "Pavement seam at the pier apron has a 1-inch lip", status: "open", upvotes: 9, hoursAgo: 52 },
  { trailId: "white-trail", pt: 6, dLat: -0.0002, dLng: 0.0002, category: "wildlife", severity: "low", note: "Wood ducks and a heron in the west cove", status: "open", upvotes: 7, hoursAgo: 80 },
  { trailId: "lime-loop", pt: 4, dLat: 0.0002, dLng: 0.0002, category: "scenic", severity: "low", note: "Wildflower patch at the north loop is outstanding", status: "open", upvotes: 5, hoursAgo: 110 },

  // ---- in-progress (6) ----
  { trailId: "blue-trail", pt: 5, dLat: 0.0002, dLng: 0.0002, category: "hazard", severity: "medium", note: "Washout at the low crossing, passable on the uphill side", status: "in-progress", upvotes: 13, hoursAgo: 40, rangerNote: "Crew scheduled to armor the crossing Friday." },
  { trailId: "yellow-trail", pt: 6, dLat: -0.0002, dLng: 0.0002, category: "hazard", severity: "high", note: "Tree down across the outer loop", status: "in-progress", upvotes: 18, hoursAgo: 60, rangerNote: "Flagged; saw crew dispatched." },
  { trailId: "park-road-trail", pt: 1, dLat: 0.0001, dLng: 0.0001, category: "accessibility", severity: "medium", note: "Puddle undermining the paved edge", status: "in-progress", upvotes: 7, hoursAgo: 72, rangerNote: "Paving contractor evaluating a full-depth patch." },
  { trailId: "red-trail", pt: 7, dLat: 0.0002, dLng: -0.0002, category: "hazard", severity: "low", note: "Loose railing at the lake overlook", status: "in-progress", upvotes: 5, hoursAgo: 90, rangerNote: "Temporary flagging in place." },
  { trailId: "white-trail", pt: 4, dLat: -0.0002, dLng: 0.0002, category: "hazard", severity: "medium", note: "Mud slide covering two-thirds of tread", status: "in-progress", upvotes: 11, hoursAgo: 120, rangerNote: "Gravel scheduled once ground dries." },
  { trailId: "mansion-trails", pt: 4, dLat: 0.0002, dLng: 0.0002, category: "hazard", severity: "low", note: "Loose stone at the ruins spur", status: "in-progress", upvotes: 3, hoursAgo: 150, rangerNote: "Masonry stabilization queued." },

  // ---- resolved (9) ----
  { trailId: "blue-trail", pt: 1, dLat: 0.0002, dLng: 0.0002, category: "hazard", severity: "medium", note: "Fallen limb hanging over the trail", status: "resolved", upvotes: 16, hoursAgo: 18, responseHrs: 1.5, rangerNote: "Limb removed; canopy inspected." },
  { trailId: "yellow-trail", pt: 2, dLat: -0.0002, dLng: 0.0002, category: "hazard", severity: "high", note: "Rut at the berm on the inner loop", status: "resolved", upvotes: 20, hoursAgo: 30, responseHrs: 2.0, rangerNote: "Rut graded and drainage ditch cleaned." },
  { trailId: "red-trail", pt: 2, dLat: 0.0002, dLng: 0.0002, category: "hazard", severity: "low", note: "Branch across the path", status: "resolved", upvotes: 4, hoursAgo: 46, responseHrs: 1.2, rangerNote: "Path cleared by maintenance." },
  { trailId: "white-trail", pt: 8, dLat: -0.0002, dLng: 0.0002, category: "hazard", severity: "medium", note: "Muddy section near the dam approach", status: "resolved", upvotes: 9, hoursAgo: 60, responseHrs: 2.4, rangerNote: "Gravel laid and rolled." },
  { trailId: "lime-loop", pt: 1, dLat: 0.0002, dLng: 0.0002, category: "hazard", severity: "low", note: "Lime blaze missing at the loop split", status: "resolved", upvotes: 2, hoursAgo: 84, responseHrs: 1.8, rangerNote: "New lime blaze installed." },
  { trailId: "park-road-trail", pt: 1, dLat: 0.0001, dLng: 0.0001, category: "accessibility", severity: "low", note: "Puddle at the pier apron", status: "resolved", upvotes: 6, hoursAgo: 100, responseHrs: 1.1, rangerNote: "Pavement patched and sealed." },
  { trailId: "mansion-trails", pt: 5, dLat: 0.0002, dLng: 0.0002, category: "hazard", severity: "medium", note: "Loose foundation stone beside the ruins", status: "resolved", upvotes: 8, hoursAgo: 124, responseHrs: 2.6, rangerNote: "Stone reset and edge marked." },
  { trailId: "lakeside-accessible-loop", pt: 8, dLat: -0.0001, dLng: 0.0001, category: "accessibility", severity: "low", note: "Drain grate sitting proud of the pavement", status: "resolved", upvotes: 5, hoursAgo: 140, responseHrs: 1.4, rangerNote: "Grate reset flush with the paved surface." },
  { trailId: "yellow-trail", pt: 8, dLat: 0.0002, dLng: 0.0002, category: "hazard", severity: "high", note: "Culvert plugged below the dam loop", status: "resolved", upvotes: 14, hoursAgo: 190, responseHrs: 2.2, rangerNote: "Culvert cleared; trail reopened." },
];

const TRAFFIC_BASE: Record<string, number> = {
  "park-road-trail": 60,
  "white-trail": 42,
  "blue-trail": 40,
  "red-trail": 36,
  "mansion-trails": 34,
  "lakeside-accessible-loop": 48,
  "lime-loop": 18,
  "yellow-trail": 14,
};

const REVIEWS: ReviewSeed[] = [
  // ---- lakeside-accessible-loop ----
  { trailId: "lakeside-accessible-loop", author: "Maya R.", rating: 5, text: "Took my mom in her wheelchair and we did the whole loop without a single rough patch. The boardwalk over the north arm is wide enough to pass another chair easily.", photoUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80", source: "Visitor photo", daysAgo: 6 },
  { trailId: "lakeside-accessible-loop", author: "Tom B.", rating: 4, text: "Paved the whole way with benches every few hundred feet. Morning shade on the west side, full sun along the north stretch.", photoUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80", source: "Trail report", daysAgo: 19 },
  { trailId: "lakeside-accessible-loop", author: "Priya N.", rating: 5, text: "Stroller-friendly in every sense — our double stroller fit with room to spare. Lots of turtles and herons off the boardwalk.", photoUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80", source: "Visitor photo", daysAgo: 34 },
  { trailId: "lakeside-accessible-loop", author: "Greg S.", rating: 4, text: "Rode it on my bike as a warm-up; 60 inches of pavement is plenty and the grades are gentle. Watch for walkers near the benches.", photoUrl: null, source: "Trail report", daysAgo: 57 },
  { trailId: "lakeside-accessible-loop", author: "Dana W.", rating: 3, text: "Beautiful lake views and genuinely accessible, but the open north side was brutally hot in July and there is no water fountain on the loop.", photoUrl: null, source: "Trail report", daysAgo: 96 },

  // ---- white-trail ----
  { trailId: "white-trail", author: "Erin K.", rating: 5, text: "Wide packed dirt and gentle grades — we pushed a jogging stroller to the dam and back without trouble. The lake views near Sunset Point are the best in the park.", photoUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80", source: "Visitor photo", daysAgo: 11 },
  { trailId: "white-trail", author: "Luis M.", rating: 4, text: "Muddy seep near the field edge after a rainy week, but the tread is broad enough to walk around it. Dam overlook is worth the walk.", photoUrl: null, source: "Trail report", daysAgo: 23 },
  { trailId: "white-trail", author: "Bev T.", rating: 5, text: "Bobolinks singing over the grass meadows the whole way. Bring binoculars.", photoUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80", source: "Visitor photo", daysAgo: 41 },
  { trailId: "white-trail", author: "Sam H.", rating: 3, text: "Easy walking but the western half is exposed and shadeless in August. The dam end is lovely.", photoUrl: null, source: "Trail report", daysAgo: 68 },
  { trailId: "white-trail", author: "Nadia F.", rating: 4, text: "Did the out-and-back with my bike and trailer; a couple of short climbs but nothing technical.", photoUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600&q=80", source: "Visitor photo", daysAgo: 104 },

  // ---- blue-trail ----
  { trailId: "blue-trail", author: "Chris D.", rating: 5, text: "Best fall color in the park along the Brandywine bend. Trail is wide enough for horses and hikers to share comfortably.", photoUrl: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&q=80", source: "Visitor photo", daysAgo: 8 },
  { trailId: "blue-trail", author: "Mara J.", rating: 4, text: "Followed the creek through the ruins — quiet and shady. One washout near the low crossing, easy to step around.", photoUrl: null, source: "Trail report", daysAgo: 27 },
  { trailId: "blue-trail", author: "Owen P.", rating: 3, text: "That oak across the trail is still there and the detour is slick. Otherwise a nice wooded ride.", photoUrl: null, source: "Trail report", daysAgo: 44 },
  { trailId: "blue-trail", author: "Talia G.", rating: 5, text: "Mountain biked the full loop; the climbs are steady rather than steep. Roots get slippery after rain.", photoUrl: "https://images.unsplash.com/photo-1486365227551-f3f90034a57c?w=600&q=80", source: "Visitor photo", daysAgo: 71 },
  { trailId: "blue-trail", author: "Hugo L.", rating: 4, text: "Took the kids and the dog — the 96-inch corridor felt roomy. The historic ruins were the highlight for them.", photoUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80", source: "Visitor photo", daysAgo: 113 },

  // ---- lime-loop ----
  { trailId: "lime-loop", author: "Wes A.", rating: 4, text: "Short, punchy loop off the Blue Trail. The wildflower patch at the north end was in full bloom.", photoUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80", source: "Visitor photo", daysAgo: 14 },
  { trailId: "lime-loop", author: "Ines C.", rating: 5, text: "Saw a bald eagle perched over the point for ten minutes. Narrower tread and some roots, so leave the stroller at home.", photoUrl: null, source: "Trail report", daysAgo: 36 },
  { trailId: "lime-loop", author: "Rob Y.", rating: 3, text: "Fun on a mountain bike but the switchback had loose rock washed across it. Hikers were slipping.", photoUrl: null, source: "Trail report", daysAgo: 62 },
  { trailId: "lime-loop", author: "Kyla S.", rating: 4, text: "Good shade most of the way and a nice view over the north arm. Horse traffic has left some ruts.", photoUrl: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80", source: "Visitor photo", daysAgo: 89 },
  { trailId: "lime-loop", author: "Devon E.", rating: 5, text: "My favorite short loop here — barely saw anyone on a Tuesday morning.", photoUrl: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&q=80", source: "Visitor photo", daysAgo: 118 },

  // ---- mansion-trails ----
  { trailId: "mansion-trails", author: "Anne-Marie V.", rating: 5, text: "The stone foundations are unexpectedly moving once you know the village was flooded. Short and easy, good with young kids.", photoUrl: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&q=80", source: "Visitor photo", daysAgo: 5 },
  { trailId: "mansion-trails", author: "Pete O.", rating: 4, text: "Packed dirt, mostly shaded, and the ruins spur is worth the extra minute. A little loose stone at the foundation edge.", photoUrl: null, source: "Trail report", daysAgo: 31 },
  { trailId: "mansion-trails", author: "Renee B.", rating: 3, text: "Interesting history but the path is only 48 inches wide in spots — tight with a stroller when someone comes the other way.", photoUrl: null, source: "Trail report", daysAgo: 55 },
  { trailId: "mansion-trails", author: "Jamal W.", rating: 4, text: "Walked it after rain and it held up well, just a few puddles. Informative signs at the Murphy Mansion site.", photoUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&q=80", source: "Visitor photo", daysAgo: 78 },
  { trailId: "mansion-trails", author: "Cleo M.", rating: 5, text: "Great little history walk. Combined it with the West Launch for a longer morning.", photoUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&q=80", source: "Visitor photo", daysAgo: 108 },

  // ---- park-road-trail ----
  { trailId: "park-road-trail", author: "Sharon K.", rating: 5, text: "The park's accessible route and it shows: smooth pavement, level grades, and a paved approach right to the fishing pier.", photoUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80", source: "Visitor photo", daysAgo: 4 },
  { trailId: "park-road-trail", author: "Miguel R.", rating: 4, text: "Pushed my dad's wheelchair to the pier easily. The low spot held standing water after the storm, though.", photoUrl: null, source: "Trail report", daysAgo: 21 },
  { trailId: "park-road-trail", author: "Hana T.", rating: 3, text: "Pavement is great but short — 0.6 miles goes fast. The flooded section near the pier apron needs fixing.", photoUrl: null, source: "Trail report", daysAgo: 47 },
  { trailId: "park-road-trail", author: "Eli N.", rating: 4, text: "Nice warm-season grass and bobolinks along the way. A one-inch pavement lip at the pier apron caught my front wheel.", photoUrl: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&q=80", source: "Visitor photo", daysAgo: 73 },
  { trailId: "park-road-trail", author: "Ruth G.", rating: 5, text: "Best sunset spot for a mobility scooter — flat the entire way and benches at the pier.", photoUrl: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=600&q=80", source: "Visitor photo", daysAgo: 111 },

  // ---- red-trail ----
  { trailId: "red-trail", author: "Cody F.", rating: 4, text: "Hiking-only east-side loop with constant lake glimpses. Narrow at 42 inches and rooty in the middle.", photoUrl: null, source: "Trail report", daysAgo: 12 },
  { trailId: "red-trail", author: "Yuki H.", rating: 5, text: "Counted eleven turtles on the basking platforms and an osprey overhead. Steep little climb at the north end.", photoUrl: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=600&q=80", source: "Visitor photo", daysAgo: 29 },
  { trailId: "red-trail", author: "Bryan M.", rating: 3, text: "Pretty, but the branch blocking half the tread was still there and the railing at the overlook is loose.", photoUrl: null, source: "Trail report", daysAgo: 58 },
  { trailId: "red-trail", author: "Lena D.", rating: 5, text: "Best wildlife loop in the park — wood ducks in the cove and a bald eagle over the basin.", photoUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80", source: "Visitor photo", daysAgo: 84 },
  { trailId: "red-trail", author: "Frank O.", rating: 4, text: "Shady and close to the East Launch, so it is easy to tack on after a swim. A few muddy spots after rain.", photoUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&q=80", source: "Visitor photo", daysAgo: 116 },

  // ---- yellow-trail ----
  { trailId: "yellow-trail", author: "Travis L.", rating: 5, text: "Proper rocky, rooty mountain-bike riding with real climbs. The dam spillway view is a great mid-ride breather.", photoUrl: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=600&q=80", source: "Visitor photo", daysAgo: 9 },
  { trailId: "yellow-trail", author: "Sonya P.", rating: 4, text: "Hard but rewarding. The upper loop erosion rut is still there — walk it, do not ride it.", photoUrl: null, source: "Trail report", daysAgo: 33 },
  { trailId: "yellow-trail", author: "Marc E.", rating: 3, text: "Six miles of roots and rock beat me up, and the dead ash leaning over the trail made me nervous. Still quiet and wild.", photoUrl: null, source: "Trail report", daysAgo: 66 },
  { trailId: "yellow-trail", author: "Gabi R.", rating: 5, text: "Saw a barred owl near the outer loop at dusk. Bring real shoes, not sneakers.", photoUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80", source: "Visitor photo", daysAgo: 92 },
  { trailId: "yellow-trail", author: "Neil S.", rating: 4, text: "Great workout, well blazed. The culvert was clear when I rode through and the trail was dry.", photoUrl: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=600&q=80", source: "Visitor photo", daysAgo: 119 },
];

const BUCKET_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];const HOUR_WEIGHT: Record<number, number> = {
  0: 0.03,
  3: 0.02,
  6: 0.15,
  9: 1.0,
  12: 0.55,
  15: 0.95,
  18: 0.45,
  21: 0.12,
};

function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const pad = (n: number) => String(n).padStart(2, "0");

function bucketLabel(d: Date, hour: number): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    hour
  )}:00`;
}

function pointOn(trailId: string, pt: number, dLat = 0, dLng = 0): LatLng {
  const trail = TRAILS.find((t) => t.id === trailId);
  if (!trail) throw new Error(`unknown trail ${trailId}`);
  const point = trail.geometry[pt % trail.geometry.length];
  return [Number((point[0] + dLat).toFixed(5)), Number((point[1] + dLng).toFixed(5))];
}

/** Populate the database if it is empty. Returns true when seeding ran. */
export function seedIfEmpty(db: Database): boolean {
  const existing = db.query("SELECT COUNT(*) AS count FROM parks").get() as {
    count: number;
  };
  if (existing.count > 0) return false;

  const now = new Date();

  const insertPark = db.prepare(
    `INSERT INTO parks (id, name, region, center_lat, center_lng, zoom, acreage)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertTrail = db.prepare(
    `INSERT INTO trails (id, park_id, name, description, distance_mi, elevation_ft,
       surface, max_slope, width_in, difficulty, walker_ok, bike_ok, wheelchair_ok,
       status, geometry, photo_url, loop)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertFeature = db.prepare(
    `INSERT INTO features (id, trail_id, lat, lng, type, title, description, alert_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertReport = db.prepare(
    `INSERT INTO reports (id, trail_id, lat, lng, category, severity, note, photo_url,
       status, upvotes, ranger_note, created_at, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertTraffic = db.prepare(
    `INSERT INTO traffic (trail_id, lat, lng, hour_bucket, visit_count)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertReview = db.prepare(
    `INSERT INTO reviews (id, trail_id, author, rating, text, photo_url, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.transaction(() => {
    insertPark.run(
      PARK.id,
      PARK.name,
      PARK.region,
      PARK.centerLat,
      PARK.centerLng,
      PARK.zoom,
      PARK.acreage
    );

    for (const t of TRAILS) {
      insertTrail.run(
        t.id,
        t.parkId,
        t.name,
        t.description,
        t.distanceMi,
        t.elevationFt,
        t.surface,
        t.maxSlope,
        t.widthIn,
        t.difficulty,
        t.walkerOk ? 1 : 0,
        t.bikeOk ? 1 : 0,
        t.wheelchairOk ? 1 : 0,
        t.status,
        JSON.stringify(t.geometry),
        t.photoUrl,
        t.loop ? 1 : 0
      );
    }

    for (const f of FEATURES) {
      insertFeature.run(
        f.id,
        f.trailId,
        f.lat,
        f.lng,
        f.type,
        f.title,
        f.description,
        f.alertText
      );
    }

    REPORTS.forEach((r, index) => {
      const [lat, lng] = pointOn(r.trailId, r.pt, r.dLat, r.dLng);
      const createdAt = new Date(now.getTime() - r.hoursAgo * 3600_000);
      let resolvedAt: string | null = null;
      if (r.status === "resolved") {
        const hrs = r.responseHrs ?? 1.8;
        resolvedAt = new Date(
          createdAt.getTime() + hrs * 3600_000
        ).toISOString();
      }
      insertReport.run(
        `rep_seed_${String(index + 1).padStart(2, "0")}`,
        r.trailId,
        lat,
        lng,
        r.category,
        r.severity,
        r.note,
        null,
        r.status,
        r.upvotes,
        r.rangerNote ?? null,
        createdAt.toISOString(),
        resolvedAt
      );
    });

    for (const t of TRAILS) {
      const base = TRAFFIC_BASE[t.id] ?? 20;
      const [lat, lng] = t.geometry[Math.floor(t.geometry.length / 2)];
      for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const day = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - dayOffset
        );
        for (const hour of BUCKET_HOURS) {
          const jitter = 0.7 + hash01(`${t.id}|${dayOffset}|${hour}`) * 0.6;
          const count = Math.max(
            1,
            Math.round(base * (HOUR_WEIGHT[hour] ?? 0.2) * jitter)
          );
          insertTraffic.run(
            t.id,
            lat,
            lng,
            bucketLabel(day, hour),
            count
          );
        }
      }
    }

    REVIEWS.forEach((r, index) => {
      const createdAt = new Date(now.getTime() - r.daysAgo * 86_400_000);
      insertReview.run(
        `rev_seed_${String(index + 1).padStart(2, "0")}`,
        r.trailId,
        r.author,
        r.rating,
        r.text,
        r.photoUrl,
        r.source,
        createdAt.toISOString()
      );
    });
  })();

  return true;
}

/** Drop every table and recreate a clean schema, then seed. */
export function resetAndSeed(db: Database): void {
  db.exec(DROP_SQL);
  db.exec(SCHEMA_SQL);
  seedIfEmpty(db);
}

function printCounts(db: Database): void {
  const tables = ["parks", "trails", "features", "reports", "reviews", "traffic"];
  const counts = tables
    .map((table) => {
      const row = db.query(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
        count: number;
      };
      return `${table}=${row.count}`;
    })
    .join(" ");
  console.log(`PAthFind seed complete: ${counts}`);
}

if (import.meta.main) {
  const reset = process.argv.includes("--reset");
  const db = new Database(DB_PATH, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA_SQL);
  if (reset) {
    console.log("Resetting database...");
    resetAndSeed(db);
  } else {
    const seeded = seedIfEmpty(db);
    console.log(seeded ? "Database was empty; seeded." : "Database already seeded.");
  }
  printCounts(db);
  db.close();
}
