/**
 * A simple point.
 */
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  distanceTo(anotherPoint) {
    const dx = anotherPoint.x - this.x;
    const dy = anotherPoint.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  polarProjection(angle, distance) {
    const angleInRadians = Math.PI / 180 * angle;
    return new Point(this.x + Math.cos(angleInRadians) * distance, this.y + Math.sin(angleInRadians) * distance);
  }

  translate(mx, my) {
    this.x += mx;
    this.y += my;
  }
}

/**
 * A line is a connection between two points.
 */
class Linesegment {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }

  intersectionWith(otherLineSegment) {
    const s1_x = this.b.x - this.a.x;
    const s1_y = this.b.y - this.a.y;
    const s2_x = otherLineSegment.b.x - otherLineSegment.a.x;
    const s2_y = otherLineSegment.b.y - otherLineSegment.a.y;

    const s = (-s1_y * (this.a.x - otherLineSegment.a.x) + s1_x * (this.a.y - otherLineSegment.a.y)) / (-s2_x * s1_y + s1_x * s2_y);
    const t = ( s2_x * (this.a.y - otherLineSegment.a.y) - s2_y * (this.a.x - otherLineSegment.a.x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      return new Point(this.a.x + (t * s1_x), this.a.y + (t * s1_y));
    }

    return undefined;
  }
}

export {Point, Linesegment};
