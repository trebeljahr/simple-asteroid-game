
const fs = require('fs');

function parsePath(d) {
    const commands = d.match(/[a-df-z][^a-df-z]*/ig) || [];
    const points = [];
    let curX = 0;
    let curY = 0;

    for (const cmd of commands) {
        const type = cmd[0];
        const args = (cmd.slice(1).match(/-?\d*\.?\d+/g) || []).map(Number);

        if (type === 'M' || type === 'L') {
            for (let i = 0; i < args.length; i += 2) {
                curX = args[i];
                curY = args[i+1];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'm' || type === 'l') {
            for (let i = 0; i < args.length; i += 2) {
                curX += args[i];
                curY += args[i+1];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'H') {
            for (let i = 0; i < args.length; i++) {
                curX = args[i];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'h') {
            for (let i = 0; i < args.length; i++) {
                curX += args[i];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'V') {
            for (let i = 0; i < args.length; i++) {
                curY = args[i];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'v') {
            for (let i = 0; i < args.length; i++) {
                curY += args[i];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'C') {
             for (let i = 0; i < args.length; i += 6) {
                curX = args[i+4];
                curY = args[i+5];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'c') {
             for (let i = 0; i < args.length; i += 6) {
                curX += args[i+4];
                curY += args[i+5];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'S') {
            for (let i = 0; i < args.length; i += 4) {
                curX = args[i+2];
                curY = args[i+3];
                points.push({x: curX, y: curY});
            }
        } else if (type === 's') {
            for (let i = 0; i < args.length; i += 4) {
                curX += args[i+2];
                curY += args[i+3];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'Q') {
            for (let i = 0; i < args.length; i += 4) {
                curX = args[i+2];
                curY = args[i+3];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'q') {
            for (let i = 0; i < args.length; i += 4) {
                curX += args[i+2];
                curY += args[i+3];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'A') {
            for (let i = 0; i < args.length; i += 7) {
                curX = args[i+5];
                curY = args[i+6];
                points.push({x: curX, y: curY});
            }
        } else if (type === 'a') {
            for (let i = 0; i < args.length; i += 7) {
                curX += args[i+5];
                curY += args[i+6];
                points.push({x: curX, y: curY});
            }
        }
    }
    return points.filter(p => !isNaN(p.x) && !isNaN(p.y));
}

function extractPointsFromSvg(filePath) {
    const svg = fs.readFileSync(filePath, 'utf8');
    const pathRegex = /<path[^>]+d="([^"]+)"/g;
    const ellipseRegex = /<ellipse[^>]+cx="([^"]+)"[^>]+cy="([^"]+)"[^>]+rx="([^"]+)"[^>]+ry="([^"]+)"/g;
    const circleRegex = /<circle[^>]+cx="([^"]+)"[^>]+cy="([^"]+)"[^>]+r="([^"]+)"/g;
    const rectRegex = /<rect[^>]+x="([^"]+)"[^>]+y="([^"]+)"[^>]+width="([^"]+)"[^>]+height="([^"]+)"/g;

    let allPoints = [];
    let match;
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
            allPoints.push({x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle)});
        }
    }
    while ((match = circleRegex.exec(svg)) !== null) {
        const cx = Number(match[1]);
        const cy = Number(match[2]);
        const r = Number(match[3]);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            allPoints.push({x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle)});
        }
    }
    while ((match = rectRegex.exec(svg)) !== null) {
        const x = Number(match[1]);
        const y = Number(match[2]);
        const w = Number(match[3]);
        const h = Number(match[4]);
        allPoints.push({x: x, y: y});
        allPoints.push({x: x + w, y: y});
        allPoints.push({x: x + w, y: y + h});
        allPoints.push({x: x, y: y + h});
    }
    return allPoints;
}

function getConvexHull(points) {
    points.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
    const n = points.length;
    if (n <= 2) return points;
    const hull = [];
    for (let i = 0; i < n; i++) {
        while (hull.length >= 2 && cross_product(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0) {
            hull.pop();
        }
        hull.push(points[i]);
    }
    for (let i = n - 2, t = hull.length + 1; i >= 0; i--) {
        while (hull.length >= t && cross_product(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0) {
            hull.pop();
        }
        hull.push(points[i]);
    }
    hull.pop();
    return hull;
}

function cross_product(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function normalizePoints(points) {
    return points.map(p => {
        const nx = (512 - p.y) / 1024;
        const ny = (p.x - 256) / 512;
        return [Number(nx.toFixed(5)), Number(ny.toFixed(5))];
    });
}

const ships = ['comet-lance', 'orbit-dart'];
const results = {};

for (const ship of ships) {
    const filePath = `client/public/assets/alternatives/ship-alt-${ship}.svg`;
    const points = extractPointsFromSvg(filePath);
    const hull = getConvexHull(points);
    results[ship] = normalizePoints(hull);
}

console.log(JSON.stringify(results, null, 2));
