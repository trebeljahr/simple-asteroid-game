import fs from "node:fs";
import path from "node:path";
import { MULTIPLAYER_SHIP_VARIANTS } from "../shared/src/multiplayerCore";

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface NormalizedCollisionShape {
  bounds: Bounds;
  loops: number[][][];
}

function parsePath(d: string): Point[] {
  const commands = d.match(/[a-df-z][^a-df-z]*/gi) || [];
  const points: Point[] = [];
  let curX = 0;
  let curY = 0;

  for (const cmd of commands) {
    const type = cmd[0];
    const args = (cmd.slice(1).match(/-?\d*\.?\d+/g) || []).map(Number);

    switch (type) {
      case "M":
      case "L":
        for (let i = 0; i < args.length; i += 2) {
          curX = args[i];
          curY = args[i + 1];
          points.push({ x: curX, y: curY });
        }
        break;
      case "m":
      case "l":
        for (let i = 0; i < args.length; i += 2) {
          curX += args[i];
          curY += args[i + 1];
          points.push({ x: curX, y: curY });
        }
        break;
      case "H":
        for (let i = 0; i < args.length; i++) {
          curX = args[i];
          points.push({ x: curX, y: curY });
        }
        break;
      case "h":
        for (let i = 0; i < args.length; i++) {
          curX += args[i];
          points.push({ x: curX, y: curY });
        }
        break;
      case "V":
        for (let i = 0; i < args.length; i++) {
          curY = args[i];
          points.push({ x: curX, y: curY });
        }
        break;
      case "v":
        for (let i = 0; i < args.length; i++) {
          curY += args[i];
          points.push({ x: curX, y: curY });
        }
        break;
      case "C":
        for (let i = 0; i < args.length; i += 6) {
          curX = args[i + 4];
          curY = args[i + 5];
          points.push({ x: curX, y: curY });
        }
        break;
      case "c":
        for (let i = 0; i < args.length; i += 6) {
          curX += args[i + 4];
          curY += args[i + 5];
          points.push({ x: curX, y: curY });
        }
        break;
      case "S":
        for (let i = 0; i < args.length; i += 4) {
          curX = args[i + 2];
          curY = args[i + 3];
          points.push({ x: curX, y: curY });
        }
        break;
      case "s":
        for (let i = 0; i < args.length; i += 4) {
          curX += args[i + 2];
          curY += args[i + 3];
          points.push({ x: curX, y: curY });
        }
        break;
      case "Q":
        for (let i = 0; i < args.length; i += 4) {
          curX = args[i + 2];
          curY = args[i + 3];
          points.push({ x: curX, y: curY });
        }
        break;
      case "q":
        for (let i = 0; i < args.length; i += 4) {
          curX += args[i + 2];
          curY += args[i + 3];
          points.push({ x: curX, y: curY });
        }
        break;
      case "A":
        for (let i = 0; i < args.length; i += 7) {
          curX = args[i + 5];
          curY = args[i + 6];
          points.push({ x: curX, y: curY });
        }
        break;
      case "a":
        for (let i = 0; i < args.length; i += 7) {
          curX += args[i + 5];
          curY += args[i + 6];
          points.push({ x: curX, y: curY });
        }
        break;
    }
  }
  return points.filter((p) => !Number.isNaN(p.x) && !Number.isNaN(p.y));
}

function extractPointsFromSvg(filePath: string): Point[] {
  const svg = fs.readFileSync(filePath, "utf8");
  const pathRegex = /<path[^>]+d="([^"]+)"/g;
  const ellipseRegex =
    /<ellipse[^>]+cx="([^"]+)"[^>]+cy="([^"]+)"[^>]+rx="([^"]+)"[^>]+ry="([^"]+)"/g;
  const circleRegex = /<circle[^>]+cx="([^"]+)"[^>]+cy="([^"]+)"[^>]+r="([^"]+)"/g;
  const rectRegex =
    /<rect[^>]+x="([^"]+)"[^>]+y="([^"]+)"[^>]+width="([^"]+)"[^>]+height="([^"]+)"/g;

  let allPoints: Point[] = [];
  let match: RegExpExecArray | null;
  while ((match = pathRegex.exec(svg)) !== null) {
    allPoints = allPoints.concat(parsePath(match[1]));
  }
  while ((match = ellipseRegex.exec(svg)) !== null) {
    const cx = Number(match[1]);
    const cy = Number(match[2]);
    const rx = Number(match[3]);
    const ry = Number(match[4]);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      allPoints.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
    }
  }
  while ((match = circleRegex.exec(svg)) !== null) {
    const cx = Number(match[1]);
    const cy = Number(match[2]);
    const r = Number(match[3]);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      allPoints.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
  }
  while ((match = rectRegex.exec(svg)) !== null) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    const w = Number(match[3]);
    const h = Number(match[4]);
    allPoints.push({ x: x, y: y });
    allPoints.push({ x: x + w, y: y });
    allPoints.push({ x: x + w, y: y + h });
    allPoints.push({ x: x, y: y + h });
  }
  return allPoints;
}

function getConvexHull(points: Point[]): Point[] {
  points.sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));
  const n = points.length;
  if (n <= 2) return points;
  const hull: Point[] = [];
  for (let i = 0; i < n; i++) {
    while (
      hull.length >= 2 &&
      cross_product(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0
    ) {
      hull.pop();
    }
    hull.push(points[i]);
  }
  for (let i = n - 2, t = hull.length + 1; i >= 0; i--) {
    while (
      hull.length >= t &&
      cross_product(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0
    ) {
      hull.pop();
    }
    hull.push(points[i]);
  }
  hull.pop();
  return hull;
}

function cross_product(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function normalizePoints(points: Point[]): number[][] {
  return points.map((p) => {
    const nx = (512 - p.y) / 1024;
    const ny = (p.x - 256) / 512;
    return [Number(nx.toFixed(5)), Number(ny.toFixed(5))];
  });
}

function main() {
  const results: Record<string, NormalizedCollisionShape> = {};

  for (const ship of MULTIPLAYER_SHIP_VARIANTS) {
    const filePath = path.join(
      process.cwd(),
      "client",
      "public",
      "assets",
      "alternatives",
      `ship-alt-${ship}.svg`,
    );
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File not found ${filePath}`);
      continue;
    }

    const points = extractPointsFromSvg(filePath);
    const hull = getConvexHull(points);
    const normalizedHull = normalizePoints(hull);

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const [nx, ny] of normalizedHull) {
      minX = Math.min(minX, nx);
      maxX = Math.max(maxX, nx);
      minY = Math.min(minY, ny);
      maxY = Math.max(maxY, ny);
    }

    results[ship] = {
      bounds: {
        minX: Number(minX.toFixed(5)),
        maxX: Number(maxX.toFixed(5)),
        minY: Number(minY.toFixed(5)),
        maxY: Number(maxY.toFixed(5)),
      },
      loops: [normalizedHull],
    };
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
