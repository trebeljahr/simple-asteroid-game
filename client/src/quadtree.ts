export class Point {
  x: number;
  y: number;
  data: any;
  constructor(x: number, y: number, data: any) {
    this.x = x;
    this.y = y;
    this.data = data;
  }
}

interface Range {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get left() {
    return this.x - this.w / 2;
  }

  get right() {
    return this.x + this.w / 2;
  }

  get top() {
    return this.y - this.h / 2;
  }

  get bottom() {
    return this.y + this.h / 2;
  }

  contains(point: Point) {
    return (
      point.x >= this.x - this.w &&
      point.x <= this.x + this.w &&
      point.y >= this.y - this.h &&
      point.y <= this.y + this.h
    );
  }

  intersects(range: Range) {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }
}

class Circle {
  x: number;
  y: number;
  r: number;
  rSquared: number;
  constructor(x: number, y: number, r: number) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.rSquared = this.r * this.r;
  }

  contains(point: Point) {
    let d = Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2);
    return d <= this.rSquared;
  }

  intersects(range: Range) {
    let xDist = Math.abs(range.x - this.x);
    let yDist = Math.abs(range.y - this.y);
    let r = this.r;

    let w = range.w;
    let h = range.h;

    let edges = Math.pow(xDist - w, 2) + Math.pow(yDist - h, 2);
    if (xDist > r + w || yDist > r + h) return false;
    if (xDist <= w || yDist <= h) return true;
    return edges <= this.rSquared;
  }
}

export class QuadTree {
  boundary: Rectangle;
  capacity: number;
  points: Point[];
  divided: boolean;
  northeast: QuadTree;
  northwest: QuadTree;
  southeast: QuadTree;
  southwest: QuadTree;
  constructor(boundary: Rectangle, capacity: number) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  subdivide() {
    let x = this.boundary.x;
    let y = this.boundary.y;
    let w = this.boundary.w / 2;
    let h = this.boundary.h / 2;

    let ne = new Rectangle(x + w, y - h, w, h);
    this.northeast = new QuadTree(ne, this.capacity);
    let nw = new Rectangle(x - w, y - h, w, h);
    this.northwest = new QuadTree(nw, this.capacity);
    let se = new Rectangle(x + w, y + h, w, h);
    this.southeast = new QuadTree(se, this.capacity);
    let sw = new Rectangle(x - w, y + h, w, h);
    this.southwest = new QuadTree(sw, this.capacity);

    this.divided = true;
  }

  insert(point: Point): boolean {
    if (!this.boundary.contains(point)) {
      return false;
    }

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northeast.insert(point) ||
      this.northwest.insert(point) ||
      this.southeast.insert(point) ||
      this.southwest.insert(point)
    );
  }

  query(range: Rectangle | Circle, found: Point[]) {
    if (!found) {
      found = [];
    }

    if (!range.intersects(this.boundary)) {
      return found;
    }

    for (let p of this.points) {
      if (range.contains(p)) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northwest.query(range, found);
      this.northeast.query(range, found);
      this.southwest.query(range, found);
      this.southeast.query(range, found);
    }

    return found;
  }

  forEach(fn: () => void) {
    this.points.forEach(fn);
    if (this.divided) {
      this.northeast.forEach(fn);
      this.northwest.forEach(fn);
      this.southeast.forEach(fn);
      this.southwest.forEach(fn);
    }
  }

  get length() {
    let count = this.points.length;
    if (this.divided) {
      count += this.northwest.length;
      count += this.northeast.length;
      count += this.southwest.length;
      count += this.southeast.length;
    }
    return count;
  }
}
