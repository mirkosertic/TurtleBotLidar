function get_distance(x1, y1, x2, y2, noise) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return Math.sqrt(dx *  dx + dy * dy) + noise;
}

function get_line_intersection(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y)
{
  var s1_x, s1_y, s2_x, s2_y;
  s1_x = p1_x - p0_x;
  s1_y = p1_y - p0_y;
  s2_x = p3_x - p2_x;
  s2_y = p3_y - p2_y;

  var s, t;
  s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
  t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
  {
    return {
      x: p0_x + (t * s1_x),
      y: p0_y + (t * s1_y)
    }
  }

  return undefined;
}

var canvas = document.getElementById("rendering");
var context = canvas.getContext("2d");

var walls = [
  {
    x1: 0,
    y1: 0,
    x2: 150,
    y2 : 0
  },
  {
    x1: 150,
    y1: 0,
    x2: 150,
    y2 : 100
  },
  {
    x1: 150,
    y1: 100,
    x2: 0,
    y2 : 100
  },
  {
    x1: 0,
    y1: 0,
    x2: 0,
    y2 : 100
  },
  {
    x1: 150,
    y1: 80,
    x2: 130,
    y2 : 80
  },
  {
    x1: 130,
    y1: 100,
    x2: 130,
    y2 : 80
  },
];

context.lineWidth = 1;
context.strokeStyle = 'black';
context.fillStyle = 'black';
context.scale(2, 2);
context.translate(100, 100);

var turtleState = {
  x: 56,
  y: 56,
  theta: 0,
  lidarLength: 100,
  lidarNoise: 0,
  lidarMinResolution: 1,
}

var turtleMindModel = {
  estimatedTurtlePosition: {x: 0, y:0, theta: 0},
  features: [],
  moveTurtleBy: function(dx, dy) {
    this.estimatedTurtlePosition.x += dx;
    this.estimatedTurtlePosition.y += dy;
  },
  rotateTurtle: function(angle) {
    this.estimatedTurtlePosition.theta += angle;
  },
};

var noiseFilter = {
  smoothing : 2.5,
  enabled: false,
  currentValue: [],
  process: function(pos, newValue) {
    if (this.enabled) {
      if (this.currentValue[pos]) {
        this.currentValue[pos] += (newValue - this.currentValue[pos]) / this.smoothing;
        return this.currentValue[pos];
      } else {
        this.currentValue[pos] = newValue;
        return newValue;
      }
    } else {
      return newValue;
    }
  }
}

function gaussianNoise(value) {
  //return (((Math.random() + Math.random() + Math.random() + Math.random()) / 4) - 0.5) * value;
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return gaussianNoise() // resample between 0 and 1
  return (num - 0.5) * value
}

function positionOverflowingValueFrom(pos, data, maxsize) {
  if (pos < 0) {
    pos += maxsize;
  } else if (pos >= maxsize) {
    pos -= maxsize;
  }
  return data[pos];
}

var derivativeOf = function(data,maxsize,offset) {
  var result = []
  for (var i = 0; i < maxsize; i++) {
    var leftPos = positionOverflowingValueFrom(i, data, maxsize);
    var rightPos = positionOverflowingValueFrom(i + offset, data, maxsize);
    if (leftPos && rightPos) {
      result[i] = (rightPos - leftPos);
    }
  }
  return result;
}

var polarLine = function(xp, yp, angle, length, color) {
  var xTarget = xp + Math.cos(Math.PI / 180 * angle) * length;
  var yTarget = yp + Math.sin(Math.PI / 180 * angle) * length;
  context.strokeStyle = color;
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(xp, yp);
  context.lineTo(xTarget, yTarget);
  context.stroke();
  context.closePath();
}

var renderData = function(xp, yp, color, data, size, shiftOffset, scaleFactor, caption, height) {

  for (var i = 0; i < size; i++) {

    var dataPoint = data[i];
    if (dataPoint) {

      var drawXPosition = xp + ((i + shiftOffset) % size);
      var drawYPositionStart = yp;
      var drawYPositionEnd = drawYPositionStart + dataPoint * scaleFactor;

      context.beginPath();
      context.strokeStyle = color;
      context.fillStyle = color;

      context.moveTo(drawXPosition, drawYPositionStart);
      context.lineTo(drawXPosition, drawYPositionEnd);

      context.stroke();
      context.closePath();
    }
  }

  context.save();

  context.beginPath();
  context.strokeStyle = 'black';
  context.fillStyle = 'black';

  context.moveTo(xp, yp - height);
  context.lineTo(xp, yp + height);

  context.translate(xp, yp);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'center';
  context.font = "8px Arial";
  context.fillText(caption, 0, -5);

  context.stroke();
  context.closePath();

  context.restore();
}

var drawSimulation = function() {

  context.clearRect(-100, -100, 1000, 1000);

  // Render reality
  context.strokeStyle = 'black';
  context.fillStyle = 'black';
  context.textAlign = 'left';
  context.font = "8px Arial";
  context.fillText('Reality', -20, -20);

  // Draw the walls
  context.strokeStyle = 'black';
  context.fillStyle = 'black';
  context.beginPath();
  for (i = 0; i < walls.length; i++) {
    var wall = walls[i];
    context.moveTo(wall.x1, wall.y1);
    context.lineTo(wall.x2, wall.y2);
  }
  context.stroke();
  context.closePath();

  // Draw the turtle
  context.beginPath();
  context.strokeStyle = 'gray';
  context.fillStyle = 'gray';
  context.arc(turtleState.x, turtleState.y, 8, 0, 2 * Math.PI);
  context.stroke();
  context.closePath();

  polarLine(turtleState.x, turtleState.y, turtleState.theta, 20, 'green');

  // Render turtles model
  context.strokeStyle = 'black';
  context.fillStyle = 'black';
  context.textAlign = 'left';
  context.font = "8px Arial";
  context.fillText('Turtles model', -20, 120);

  context.beginPath();
  context.strokeStyle = 'gray';
  context.fillStyle = 'gray';
  context.arc(turtleMindModel.estimatedTurtlePosition.x + 56, turtleMindModel.estimatedTurtlePosition.y + 200, 8, 0, 2 * Math.PI);
  context.stroke();
  context.closePath();

  polarLine(turtleMindModel.estimatedTurtlePosition.x + 56, turtleMindModel.estimatedTurtlePosition.y + 200, turtleMindModel.estimatedTurtlePosition.theta, 20, 'green');

  var currentRay = 0;
  var currentFrame = [];
  var angles = [];

  var maxNumScans = 360 / turtleState.lidarMinResolution;
  var rotationOffset = maxNumScans / 2;

  for (var i = turtleState.theta; i < turtleState.theta + 360; i += turtleState.lidarMinResolution, currentRay++) {
    var rayTargetX = turtleState.x + Math.cos(Math.PI / 180 * i) * turtleState.lidarLength;
    var rayTargetY = turtleState.y + Math.sin(Math.PI / 180 * i) * turtleState.lidarLength;

    var nearestIntersection = undefined;
    for (var j = 0; j < walls.length; j++) {
      var wall = walls[j];

      var intersection = get_line_intersection(turtleState.x, turtleState.y, rayTargetX, rayTargetY, wall.x1, wall.y1, wall.x2, wall.y2);
      if (intersection) {
        var distance = noiseFilter.process(currentRay, get_distance(turtleState.x, turtleState.y, intersection.x, intersection.y, gaussianNoise(turtleState.lidarNoise)));
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

      currentFrame[currentRay] = nearestIntersection.distance;
      angles[currentRay] = i;

      // Do some back projection
      var angleInRadians = Math.PI / 180 * i;
      var wallX = turtleState.x + Math.cos(angleInRadians) * nearestIntersection.distance;
      var wallY = turtleState.y + Math.sin(angleInRadians) * nearestIntersection.distance;

      context.beginPath();
      context.strokeStyle = 'CadetBlue';
      context.fillStyle = 'CadetBlue';
      context.arc(wallX, wallY, 2, 0, 2 * Math.PI);
      context.stroke();
      context.closePath();

      context.beginPath();
      if (currentRay === 0) {
        context.strokeStyle = 'green';
        context.fillStyle = 'green';
      } else {
        context.strokeStyle = 'CadetBlue';
        context.fillStyle = 'CadetBlue';
      }

      var scanProfileX = 200 + ((currentRay + rotationOffset) % maxNumScans);
      var scanProfileYStart = 50;
      var scanProfileYEnd = scanProfileYStart - nearestIntersection.distance;

      context.moveTo(scanProfileX, scanProfileYStart);
      context.lineTo(scanProfileX, scanProfileYEnd);

      context.stroke();
      context.closePath();

    } else {
      context.strokeStyle = 'rgba(128,128,128,0.05)';
      context.fillStyle = 'rgba(128,128,128,0.05)';
      context.beginPath();
      context.moveTo(turtleState.x, turtleState.y);
      context.lineTo(rayTargetX, rayTargetY);
      context.stroke();
      context.closePath();
    }
  }

  context.save();
  context.beginPath();
  context.strokeStyle = 'black';
  context.fillStyle = 'black';
  context.moveTo(200, 50);
  context.lineTo(200, 50 - 120);
  context.translate(200, 50);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'center';
  context.font = "8px Arial";
  context.fillText('Lidar distance', 60, -5);
  context.stroke();
  context.closePath();
  context.restore();

  var rateOfChanges1st = derivativeOf(currentFrame, currentRay, 1);
  var rateOfChanges2nd = derivativeOf(rateOfChanges1st, currentRay, 1);

  var maxNumScans = 360 / turtleState.lidarMinResolution;
  var rotationOffset = maxNumScans / 2;

  // Render derivatives
  renderData(200, 90, 'DarkSlateGrey', rateOfChanges1st, maxNumScans, rotationOffset, 3, '1st derivative', 20);
  renderData(200, 160, 'DarkSlateGrey', rateOfChanges2nd, maxNumScans, rotationOffset, 15, '2nd derivative',20);

  // Check for maxima and sharp edges
  for (var i = 0; i < currentRay; i++) {
    var current1stValue = positionOverflowingValueFrom(i, rateOfChanges1st, maxNumScans);
    var previous1stValue = positionOverflowingValueFrom(i - 1, rateOfChanges1st, maxNumScans);

    var current2ndValue = positionOverflowingValueFrom(i, rateOfChanges2nd, maxNumScans);

    var featureDetected = false;
    if (current1stValue && previous1stValue && current2ndValue) {
      if (previous1stValue >= 0 && current1stValue < 0) {
        // Farest point, maxima in lidar data
        featureDetected = true;
      } else if (previous1stValue < 0 && current1stValue > 0.025) {
        // Sharp edge
        featureDetected = true;
      }
    }
    var distance = currentFrame[i];
    if (featureDetected && distance) {

      var angle = angles[i];
      var angleInRadians = Math.PI / 180 * angle;
      var featureX = turtleState.x + Math.cos(angleInRadians) * distance;
      var featureY = turtleState.y + Math.sin(angleInRadians) * distance;

      // Mark Feature on the Map
      context.beginPath();
      context.strokeStyle = 'red';
      context.fillStyle = 'red';
      context.arc(featureX, featureY, 2, 0, 2 * Math.PI);
      context.stroke();
      context.closePath();

      context.strokeStyle = 'lightgray';
      context.fillStyle = 'lightgray';
      context.beginPath();
      context.moveTo(turtleState.x, turtleState.y);
      context.lineTo(featureX, featureY);
      context.stroke();
      context.closePath();

      // Mark Feature in Lidar data
      var maxNumScans = 360 / turtleState.lidarMinResolution;
      var rotationOffset = maxNumScans / 2;

      var scanProfileX = 200 + ((i + rotationOffset) % maxNumScans);
      var scanProfileYStart = 90;
      var scanProfileYEnd = scanProfileYStart - rateOfChanges1st[i];

      context.beginPath();
      context.strokeStyle = 'red';
      context.fillStyle = 'red';
      context.arc(scanProfileX, scanProfileYEnd, 2, 0, 2 * Math.PI);
      context.stroke();
      context.closePath();

      // Mark Feature in 1st derivative data
      var scanProfileX = 200 + ((i + rotationOffset) % maxNumScans);
      var scanProfileYStart = 50;
      var scanProfileYEnd = scanProfileYStart - currentFrame[i];

      context.beginPath();
      context.strokeStyle = 'red';
      context.fillStyle = 'red';
      context.arc(scanProfileX, scanProfileYEnd, 2, 0, 2 * Math.PI);
      context.stroke();
      context.closePath();
    }
  }
}

var callback = function() {
  drawSimulation();
  window.requestAnimationFrame(callback);
}

window.requestAnimationFrame(callback);

window.addEventListener("keydown", function(event) {
  if (event.key == "ArrowUp") {

    var dx = Math.cos(Math.PI / 180 * turtleState.theta) * 3;
    var dy = Math.sin(Math.PI / 180 * turtleState.theta) * 3;

    turtleState.x += dx;
    turtleState.y += dy;

    turtleMindModel.moveTurtleBy(dx, dy)
  }
  if (event.key == "ArrowDown") {
    var dx = Math.cos(Math.PI / 180 * turtleState.theta) * -3;
    var dy =  Math.sin(Math.PI / 180 * turtleState.theta) * -3;

    turtleState.x += dx;
    turtleState.y += dy;

    turtleMindModel.moveTurtleBy(dx, dy)
  }
  if (event.key == "ArrowLeft") {
    turtleState.theta -= 2;

    turtleMindModel.rotateTurtle(-2);
  }
  if (event.key == "ArrowRight") {
    turtleState.theta += 2;

    turtleMindModel.rotateTurtle(2);
  }
});

