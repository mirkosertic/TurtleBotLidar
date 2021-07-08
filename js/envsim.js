import {Linesegment, Point} from "./geom.js"
import {gaussianNoise} from "./noise";

class TurtleState {

  constructor() {
    this.location = new Point(56, 56);
    this.theta = 45;
    this.lidarLength = 100;
    this.lidarNoise = 0;
    this.lidarSamples = 0;
    this.lidarMinResolution = 1;
    this.edgeDetectionThreshold = 5;
    this.walls = [
      new Linesegment(new Point(0,0), new Point(150, 0)),
      new Linesegment(new Point(150, 0), new Point(150, 100)),
      new Linesegment(new Point(150, 100), new Point(0, 100)),
      new Linesegment(new Point(0, 0), new Point(0, 100)),
      new Linesegment(new Point(150, 80), new Point(130, 80)),
      new Linesegment(new Point(130, 100), new Point(130, 80))
    ];
  }

  lidarFrame() {
    const distances = [];
    const angles = [];

    let currentRay = 0;
    for (let i = this.theta; i < this.theta + 360; i += this.lidarMinResolution, currentRay++) {
      angles[currentRay] = i;

      const lidarRayTarget = this.location.polarProjection(i, this.lidarLength);

      var nearestIntersection = undefined;
      for (let j = 0; j < this.walls.length; j++) {
        const wall = this.walls[j];
        const intersection = wall.intersectionWith(new Linesegment(this.location, lidarRayTarget));
        if (intersection) {
          let distance = this.location.distanceTo(intersection) + gaussianNoise(this.lidarNoise);
          for (let k = 0; k < this.lidarSamples; k++) {
            let d2 = this.location.distanceTo(intersection) + gaussianNoise(this.lidarNoise);
            distance = (distance + d2) / 2;
          }
          if (nearestIntersection) {
            if (nearestIntersection.distance > distance) {
              nearestIntersection = {
                distance: distance,
                intersection: intersection
              };
            }
          } else {
            nearestIntersection = {
              distance: distance,
              intersection: intersection
            }
          }
        }
      }

      if (nearestIntersection) {
        distances[currentRay] = nearestIntersection.distance;
      }
    }

    return {
      angles: angles,
      distances: distances
    }
  }
}

export {TurtleState};
