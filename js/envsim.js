import {Linesegment, Point} from "./geom.js"

class TurtleState {

  constructor() {
    this.location = new Point(56, 56);
    this.theta = 0;
    this.lidarLength = 100;
    this.lidarNoise = 0;
    this.lidarMinResolution = 1;
    this.walls = [
      new Linesegment(new Point(0,0), new Point(150, 0)),
      new Linesegment(new Point(150, 0), new Point(150, 100)),
      new Linesegment(new Point(150, 100), new Point(0, 100)),
      new Linesegment(new Point(0, 0), new Point(0, 100)),
      new Linesegment(new Point(150, 80), new Point(130, 80)),
      new Linesegment(new Point(130, 100), new Point(130, 80))
    ];
  }
}

export {TurtleState};
