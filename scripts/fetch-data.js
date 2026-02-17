import { writeFileSync, mkdirSync } from "fs";
import osmtogeojson from "osmtogeojson";
import booleanIntersects from "@turf/boolean-intersects";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

async function queryOverpass(query, retries = 3) {
  for (let i = 0; i < retries; i++) {
    if (i > 0) {
      console.log(`Retry ${i}/${retries - 1}, waiting 30s...`);
      await new Promise((r) => setTimeout(r, 30000));
    }
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (res.ok) return res.json();
    if (i === retries - 1) throw new Error(`Overpass error: ${res.status} ${res.statusText}`);
    console.log(`Got ${res.status}, retrying...`);
  }
}

async function fetchParking() {
  console.log("Fetching parking data from Overpass API...");

  // Wilmington, DE bounding box
  const bbox = "39.7100,-75.5900,39.7850,-75.5000";

  const query = `
    [out:json][timeout:60];
    (
      way["amenity"="parking"](${bbox});
      relation["amenity"="parking"](${bbox});
      way["building"="parking"](${bbox});
      relation["building"="parking"](${bbox});
      way["landuse"="parking"](${bbox});
    );
    out body geom;
  `;

  const data = await queryOverpass(query);
  const geojson = osmtogeojson(data);

  // Filter to only polygons (skip any point features)
  geojson.features = geojson.features.filter(
    (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
  );

  console.log(`Found ${geojson.features.length} parking polygons`);
  return geojson;
}

// Hand-drawn downtown Wilmington boundary
// North: Brandywine Creek / Augustine Cut-Off area
// South: Christina River
// West: I-95 / Adams St corridor
// East: Walnut St / riverfront
function getDowntownBoundary() {
  console.log("Using downtown Wilmington boundary...");

  const boundary = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Downtown Wilmington" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-75.5528, 39.7545], // NW
              [-75.5338, 39.7477], // NE
              [-75.5442, 39.7305], // SE
              [-75.5632, 39.7373], // SW
              [-75.5528, 39.7545], // close
            ],
          ],
        },
      },
    ],
  };

  return boundary;
}

async function main() {
  mkdirSync("public/data", { recursive: true });

  const allParking = await fetchParking();
  const boundary = getDowntownBoundary();

  // Filter parking to only features intersecting downtown boundary
  const downtownPoly = boundary.features[0];
  const parking = {
    ...allParking,
    features: allParking.features.filter((f) => booleanIntersects(f, downtownPoly)),
  };
  console.log(`${parking.features.length} parking features within downtown boundary`);

  writeFileSync("public/data/parking.geojson", JSON.stringify(parking, null, 2));
  console.log("Wrote public/data/parking.geojson");

  writeFileSync("public/data/boundary.geojson", JSON.stringify(boundary, null, 2));
  console.log("Wrote public/data/boundary.geojson");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
