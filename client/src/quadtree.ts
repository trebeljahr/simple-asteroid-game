export interface QuadTreeItem<T> {
  x: number;
  y: number;
  data: T;
}

export interface QueryRange {
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
}

class RectangleBoundary {
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;

  constructor(x: number, y: number, halfWidth: number, halfHeight: number) {
    this.x = x;
    this.y = y;
    this.halfWidth = halfWidth;
    this.halfHeight = halfHeight;
  }

  contains<T>(item: QuadTreeItem<T>) {
    return (
      item.x >= this.x - this.halfWidth &&
      item.x <= this.x + this.halfWidth &&
      item.y >= this.y - this.halfHeight &&
      item.y <= this.y + this.halfHeight
    );
  }

  intersects(range: QueryRange) {
    return !(
      range.x - range.halfWidth > this.x + this.halfWidth ||
      range.x + range.halfWidth < this.x - this.halfWidth ||
      range.y - range.halfHeight > this.y + this.halfHeight ||
      range.y + range.halfHeight < this.y - this.halfHeight
    );
  }
}

const createChildBoundary = (boundary: RectangleBoundary, xOffset: number, yOffset: number) => {
  return new RectangleBoundary(
    boundary.x + xOffset * (boundary.halfWidth / 2),
    boundary.y + yOffset * (boundary.halfHeight / 2),
    boundary.halfWidth / 2,
    boundary.halfHeight / 2,
  );
};

export const createQueryRange = (
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number,
): QueryRange => {
  return {
    x,
    y,
    halfWidth,
    halfHeight,
  };
};

export class QuadTree<T> {
  boundary: RectangleBoundary;
  capacity: number;
  items: Array<QuadTreeItem<T>>;
  divided: boolean;
  northeast: QuadTree<T> | null;
  northwest: QuadTree<T> | null;
  southeast: QuadTree<T> | null;
  southwest: QuadTree<T> | null;

  constructor(boundary: QueryRange, capacity: number) {
    this.boundary = new RectangleBoundary(
      boundary.x,
      boundary.y,
      boundary.halfWidth,
      boundary.halfHeight,
    );
    this.capacity = capacity;
    this.items = [];
    this.divided = false;
    this.northeast = null;
    this.northwest = null;
    this.southeast = null;
    this.southwest = null;
  }

  subdivide() {
    this.northeast = new QuadTree<T>(createChildBoundary(this.boundary, 1, -1), this.capacity);
    this.northwest = new QuadTree<T>(createChildBoundary(this.boundary, -1, -1), this.capacity);
    this.southeast = new QuadTree<T>(createChildBoundary(this.boundary, 1, 1), this.capacity);
    this.southwest = new QuadTree<T>(createChildBoundary(this.boundary, -1, 1), this.capacity);
    this.divided = true;
  }

  insert(item: QuadTreeItem<T>): boolean {
    if (!this.boundary.contains(item)) {
      return false;
    }

    if (this.items.length < this.capacity) {
      this.items.push(item);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      (this.northeast !== null && this.northeast.insert(item)) ||
      (this.northwest !== null && this.northwest.insert(item)) ||
      (this.southeast !== null && this.southeast.insert(item)) ||
      (this.southwest !== null && this.southwest.insert(item))
    );
  }

  query(range: QueryRange, found: Array<QuadTreeItem<T>> = []) {
    if (!this.boundary.intersects(range)) {
      return found;
    }

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (
        item.x >= range.x - range.halfWidth &&
        item.x <= range.x + range.halfWidth &&
        item.y >= range.y - range.halfHeight &&
        item.y <= range.y + range.halfHeight
      ) {
        found.push(item);
      }
    }

    if (this.divided) {
      this.northwest && this.northwest.query(range, found);
      this.northeast && this.northeast.query(range, found);
      this.southwest && this.southwest.query(range, found);
      this.southeast && this.southeast.query(range, found);
    }

    return found;
  }
}
