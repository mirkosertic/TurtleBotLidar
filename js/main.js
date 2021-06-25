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

// Taken from https://stackoverflow.com/questions/37224912/circle-line-segment-collision/37225895
function inteceptCircleLineSeg(cx, cy, cr, p1x, p1y, p2x, p2y) {
  var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
  v1 = {};
  v2 = {};
  v1.x = p2x - p1x;
  v1.y = p2y - p1y;
  v2.x = p1x - cx;
  v2.y = p1y - cy;
  b = (v1.x * v2.x + v1.y * v2.y);
  c = 2 * (v1.x * v1.x + v1.y * v1.y);
  b *= -2;
  d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - cr * cr));
  if (isNaN(d)){ // no intercept
    return [];
  }
  u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
  u2 = (b + d) / c;
  retP1 = {};   // return points
  retP2 = {}
  ret = []; // return array
  if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
    retP1.x = p1x + v1.x * u1;
    retP1.y = p2y + v1.y * u1;
    ret[0] = retP1;
  }
  if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
    retP2.x = p1x + v1.x * u2;
    retP2.y = p2y + v1.y * u2;
    ret[ret.length] = retP2;
  }
  return ret;
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
  particles: [
    {
      x: 0,
      y:0,
      theta: 0,
      score: 1
    }
  ],
  estimatedState: function() {
      var x = undefined;
      var y = undefined;
      var theta = undefined;
      for (var i = 0; i < this.particles.length; i++) {
        var particle = this.particles[i];
        if (x) {
          x = (x + particle.x) / 2;
        } else {
          x = particle.x;
        }
        if (y) {
          y = (y + particle.y) / 2;
        } else {
          y = particle.y;
        }
        if (theta) {
          theta = (theta + particle.theta) / 2;
        } else {
          theta = particle.theta;
        }
      }
      return {
        x: x,
        y: y,
        theta: theta
      }
  },
  randomness: 1,
  features: [],
  featureDetectionRadius: 3,
  moveTurtleBy: function(dx, dy) {
    var newParticles = [];
    for (var i = 0; i < this.particles.length; i++) {
      var particle = this.particles[i];
      particle.x += dx;
      particle.y += dy;
      if (particle.score > 0) {
        for (var j = 0; j < this.randomness; j++) {
          var newParticle = {
            x: particle.x + dx + gaussianNoise(30),
            y: particle.y + dy + gaussianNoise(30),
            theta: particle.theta + gaussianNoise(10),
          };
          newParticles.push(newParticle);
        }
      }
    }
    this.particles = this.particles.concat(newParticles);
  },
  rotateTurtle: function(angle) {
    var newParticles = [];
    for (var i = 0; i < this.particles.length; i++) {
      var particle = this.particles[i];
      particle.theta += angle;
      if (particle.score > 0) {
        for (var j = 0; j < this.randomness; j++) {
          var newParticle = {
            x: particle.x + gaussianNoise(5),
            y: particle.y + gaussianNoise(5),
            theta: particle.theta + angle + gaussianNoise(10),
          };
          newParticles.push(newParticle);
        }
      }
    }
    this.particles = this.particles.concat(newParticles);
  },
  updateParticleState: function(detectedFeatures) {
    var estimatedState = turtleMindModel.estimatedState();

    // If we do not have features, we initially add the found one to our map
    if (this.features.length === 0) {
      for (var i = 0; i < detectedFeatures.length; i++) {
        var feature = detectedFeatures[i];

        var angleInRadians = Math.PI / 180 * (feature.angle + estimatedState.theta);
        var featureX = estimatedState.x + Math.cos(angleInRadians) * feature.distance;
        var featureY = estimatedState.y + Math.sin(angleInRadians) * feature.distance;

        this.features.push({
            x: featureX,
            y: featureY
        });
      }
    } else {
      // Now comes the tricky part: we evaluate the found features against
      // every particle and verify the expectations
      for (var i = 0; i < this.particles.length; i++) {
        var particle = this.particles[i];
        particle.score = 0;
        for (var j = 0; j < this.features.length; j++) {
          var expectedFeature = this.features[j];
          var dx = expectedFeature.x - particle.x;
          var dy = expectedFeature.y - particle.y;
          // Now we check, if there is such a feature
          for (var k = 0; k < detectedFeatures.length; k++) {
            var detectedFeature = detectedFeatures[k];

            var angleInRadians = Math.PI / 180 * (detectedFeature.angle + particle.theta);
            var detectedFeatureX = Math.cos(angleInRadians) * detectedFeature.distance;
            var detectedFeatureY = Math.sin(angleInRadians) * detectedFeature.distance;

            context.beginPath();
            context.strokeStyle = 'gray';
            context.fillStyle = 'gray';
            context.arc(56 + particle.x + detectedFeatureX, particle.y + 200 + detectedFeatureY, 8, 0, 2 * Math.PI);
            context.stroke();
            context.closePath();

            context.beginPath();
            context.strokeStyle = 'blue';
            context.fillStyle = 'blue';
            context.arc(56 + estimatedState.x + dx, 200 + estimatedState.y + dy, 6, 0, 2 * Math.PI);
            context.stroke();
            context.closePath();

            var dfX = Math.abs(detectedFeatureX - dx);
            var dfY = Math.abs(detectedFeatureY - dy);

            console.log("dfX = " + dfX + ", dfY = " + dfY);

            if (dfX < 1 && dfY < 1) {
              // Maybe a match, the particle gets a hit point
              particle.score += 1;
            }
          }
        }
      }
      // We calculate the mean score
      var meanScore = undefined;
      for (var i = 0; i < this.particles.length; i++) {
        if (meanScore) {
          meanScore = (meanScore + this.particles[i].score) / 2;
        } else {
          meanScore = this.particles[i].score;
        }
      }

      // We are done here, now we evaluate dead particles
      this.particles = this.particles.filter(function(value, index, arr) {
        if (value.score >= meanScore) {
          return true;
        } else {
          console.log("Particle " + index + " got score " + value.score + " from " + detectedFeatures.length + " and will be removed!");
          return false;
        }
      });
    }
  }
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
  for (var i = 0; i < walls.length; i++) {
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
  context.fillText('Turtles model no.F. = ' + turtleMindModel.features.length + ", no. P = " + turtleMindModel.particles.length, -20, 120);

  for (var i = 0; i < turtleMindModel.particles.length; i++) {
    var particle = turtleMindModel.particles[i];
    context.beginPath();
    context.strokeStyle = 'gray';
    context.fillStyle = 'gray';
    context.arc(particle.x + 56, particle.y + 200, 8, 0, 2 * Math.PI);
    context.stroke();
    context.closePath();
    polarLine(particle.x + 56, particle.y + 200, particle.theta, 20, 'green');
  }

  for (var i = 0; i < turtleMindModel.features.length; i++) {
    var feature = turtleMindModel.features[i];
    context.beginPath();
    context.strokeStyle = 'red';
    context.fillStyle = 'red';
    context.arc(feature.x - 1 + 56, feature.y -1 + 200, 3, 0, 2 * Math.PI);
    context.stroke();
    context.closePath();

  }

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

  var detectedFeatures = [];

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

      detectedFeatures.push({
        angle: angle - turtleState.theta,
        distance: distance
      });

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

  turtleMindModel.updateParticleState(detectedFeatures);
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

