import {Point, Linesegment} from "./geom.js";
import {gaussianNoise} from "./noise.js";
import {TurtleState} from "./envsim.js";
import {derivativeOf, positionOverflowingValueFrom} from "./derivative.js";

const canvas = document.getElementById("rendering");
const context = canvas.getContext("2d");

context.lineWidth = 1;
context.strokeStyle = 'black';
context.fillStyle = 'black';
context.scale(2, 2);
context.translate(100, 100);

const turtleState = new TurtleState();

const turtleMindModel = {
  particles: [
    {
      location: new Point(0, 0),
      theta: turtleState.theta,
      score: 1,
      uncertainty: Math.pow(10, 2)
    }
  ],
  estimatedState: function () {
    var x = undefined;
    var y = undefined;
    var theta = undefined;
    var uncertainty = undefined;
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (x) {
        x = (x + particle.location.x) / 2;
      } else {
        x = particle.location.x;
      }
      if (y) {
        y = (y + particle.location.y) / 2;
      } else {
        y = particle.location.y;
      }
      if (theta) {
        theta = (theta + particle.theta) / 2;
      } else {
        theta = particle.theta;
      }
      if (uncertainty) {
        uncertainty = (uncertainty + particle.uncertainty) / 2;
      } else {
        uncertainty = particle.uncertainty;
      }
    }
    return {
      location: new Point(x, y),
      theta: theta,
      uncertainty: uncertainty
    }
  },
  features: [],
  featureDetectionRadius: 3,

  moveTurtleBy: function (dx, dy) {
    const newParticles = [];
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      particle.location.translate(dx + gaussianNoise(3), dy + gaussianNoise(3));
      particle.uncertainty = Math.pow(10, 2)
    }
    this.particles = this.particles.concat(newParticles);
  },

  rotateTurtle: function (angle) {
    const newParticles = [];
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      particle.theta += angle;
      particle.uncertainty = Math.pow(10, 2)
    }
    this.particles = this.particles.concat(newParticles);
  },
  updateParticleState: function (detectedFeatures) {
    const estimatedState = turtleMindModel.estimatedState();

    // If we do not have features, we initially add the found one to our map
    if (this.features.length === 0) {
      for (let i = 0; i < detectedFeatures.length; i++) {
        const feature = detectedFeatures[i];
        this.features.push({
            uncertainty: Math.pow(10, 2),
            location: estimatedState.location.polarProjection(feature.angle + estimatedState.theta, feature.distance)
        });
      }
    } else {
      // Now comes the tricky part: we evaluate the found features against
      // every particle and verify the expectations
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        particle.score = 0;
        for (let j = 0; j < this.features.length; j++) {
          const expectedFeature = this.features[j];

          // Now we check, if there is such a feature
          for (let k = 0; k < detectedFeatures.length; k++) {
            const detectedFeature = detectedFeatures[k];

            const featureProjection = new Point(0, 0).polarProjection(detectedFeature.angle + particle.theta, detectedFeature.distance);

            // This is what we have measured
            const measuredFeaturePosition = featureProjection.translate(particle.location.x, particle.location.y);

            context.beginPath();
            context.strokeStyle = 'gray';
            context.fillStyle = 'gray';
            context.arc(56 + measuredFeaturePosition.x, 200 + measuredFeaturePosition.y, 8, 0, 2 * Math.PI);
            context.stroke();
            context.closePath();

            const distance = measuredFeaturePosition.distanceTo(expectedFeature.location);

            if (distance < 10) {
              detectedFeature.identified = true;

              // This is what we have found
              context.beginPath();
              context.strokeStyle = 'blue';
              context.fillStyle = 'blue';
              context.arc(56 + measuredFeaturePosition.x, 200 + measuredFeaturePosition.y, 6, 0, 2 * Math.PI);
              context.stroke();
              context.closePath();

              // Maybe a match, the particle gets a hit point
              particle.score += 1;

              //
              // Kalman filter
              //

              // Previous state, distance to feature
              const distanceToFeature = expectedFeature.location.distanceTo(particle.location);

              // We calculate the Kalman gain
              const kg = estimatedState.uncertainty / (estimatedState.uncertainty + detectedFeature.uncertainty);

              // Uncertainty update
              particle.uncertainty = (1 - kg) * estimatedState.uncertainty;

              // Estimate the new distance based on previous state and current measurement
              const updatedNewDistance = distanceToFeature + kg * (detectedFeature.distance - distanceToFeature);

              const oldLocation = particle.location;

              // Backprojection of new distance from feature to get the new estimated position
              particle.location = expectedFeature.location.polarProjection(detectedFeature.angle + particle.theta + 180, updatedNewDistance);
              expectedFeature.location = oldLocation.polarProjection(detectedFeature.angle + particle.theta, updatedNewDistance);
            }
          }
        }
      }
      // We calculate the mean score
      var meanScore = undefined;
      for (let i = 0; i < this.particles.length; i++) {
        if (meanScore) {
          meanScore = (meanScore + this.particles[i].score) / 2;
        } else {
          meanScore = this.particles[i].score;
        }
      }

      // We are done here, now we evaluate dead particles
      this.particles = this.particles.filter(function (value, index, arr) {
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

function polarLine(location, angle, length, color) {
  const rayTarget = location.polarProjection(angle, length);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(location.x, location.y);
  context.lineTo(rayTarget.x, rayTarget.y);
  context.stroke();
  context.closePath();
}

function renderData(xp, yp, color, data, size, shiftOffset, scaleFactor, caption, height) {

  for (let i = 0; i < size; i++) {

    const dataPoint = data[i];
    if (dataPoint) {

      const drawXPosition = xp + ((i + shiftOffset) % size);
      const drawYPositionStart = yp;
      const drawYPositionEnd = drawYPositionStart + dataPoint * scaleFactor;

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

var dataBlob = undefined;

function drawSimulation() {

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
  for (let i = 0; i < turtleState.walls.length; i++) {
    const wall = turtleState.walls[i];
    context.moveTo(wall.a.x, wall.a.y);
    context.lineTo(wall.b.x, wall.b.y);
  }
  context.stroke();
  context.closePath();

  // Draw the turtle
  context.beginPath();
  context.strokeStyle = 'gray';
  context.fillStyle = 'gray';
  context.arc(turtleState.location.x, turtleState.location.y, 8, 0, 2 * Math.PI);
  context.stroke();
  context.closePath();

  polarLine(turtleState.location, turtleState.theta, 20, 'green');

  // Render turtles model
  context.strokeStyle = 'black';
  context.fillStyle = 'black';
  context.textAlign = 'left';
  context.font = "8px Arial";
  context.fillText('Turtles model no.F. = ' + turtleMindModel.features.length + ", no. P = " + turtleMindModel.particles.length, -20, 120);

  for (let i = 0; i < turtleMindModel.particles.length; i++) {
    const particle = turtleMindModel.particles[i];
    context.beginPath();
    context.strokeStyle = 'gray';
    context.fillStyle = 'gray';
    context.arc(particle.location.x + 56, particle.location.y + 200, 8, 0, 2 * Math.PI);
    context.stroke();
    context.closePath();
    polarLine(new Point(particle.location.x + 56, particle.location.y + 200), particle.theta, 20, 'green');

    context.strokeStyle = 'black';
    context.fillStyle = 'black';
    context.textAlign = 'left';
    context.font = "8px Arial";
    context.fillText('Uncertainty:', particle.location.x + 46, particle.location.y + 170);
    context.fillText(particle.uncertainty.toPrecision(4), particle.location.x + 46, particle.location.y + 180);
  }

  for (let i = 0; i < turtleMindModel.features.length; i++) {
    const feature = turtleMindModel.features[i];
    context.beginPath();
    context.strokeStyle = 'red';
    context.fillStyle = 'red';
    context.arc(feature.location.x - 1 + 56, feature.location.y -1 + 200, 3, 0, 2 * Math.PI);
    context.stroke();
    context.closePath();
  }

  const lidarFrame = turtleState.lidarFrame();

  const currentRay = lidarFrame.angles.length;
  const currentFrame = lidarFrame.distances;
  const angles = lidarFrame.angles;

  const maxNumScans = 360 / turtleState.lidarMinResolution;
  const rotationOffset = maxNumScans / 2;

  for (let i = 0; i < currentRay; i += 1) {

    const lidarRayTarget = turtleState.location.polarProjection(i + turtleState.theta, turtleState.lidarLength);

    const distance = currentFrame[i];
    if (distance) {
      const wallHitPoint = turtleState.location.polarProjection(i + turtleState.theta, distance);

      context.beginPath();
      context.strokeStyle = 'CadetBlue';
      context.fillStyle = 'CadetBlue';
      context.arc(wallHitPoint.x, wallHitPoint.y, 2, 0, 2 * Math.PI);
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

      const scanProfileX = 200 + ((i + rotationOffset) % maxNumScans);
      const scanProfileYStart = 50;
      const scanProfileYEnd = scanProfileYStart - distance;

      context.moveTo(scanProfileX, scanProfileYStart);
      context.lineTo(scanProfileX, scanProfileYEnd);

      context.stroke();
      context.closePath();

    } else {

      context.strokeStyle = 'rgba(128,128,128,0.05)';
      context.fillStyle = 'rgba(128,128,128,0.05)';
      context.beginPath();
      context.moveTo(turtleState.location.x, turtleState.location.y);
      context.lineTo(lidarRayTarget.x, lidarRayTarget.y);
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

  const rateOfChanges1st = derivativeOf(currentFrame, currentRay, turtleState.edgeDetectionThreshold);
  const rateOfChanges2nd = derivativeOf(rateOfChanges1st, currentRay, turtleState.edgeDetectionThreshold);

  // Render derivatives
  renderData(200, 90, 'DarkSlateGrey', rateOfChanges1st, maxNumScans, rotationOffset, 5, '1st derivative', 20);
  renderData(200, 160, 'DarkSlateGrey', rateOfChanges2nd, maxNumScans, rotationOffset, 20, '2nd derivative',20);

  const detectedFeatures = [];

  var csv = 'Angle;Distance;1st dvt;2nd dvt;Feature Detected\n';

  // Check for maxima and sharp edges
  for (let i = 0; i < currentRay; i++) {
    const current1stValue = positionOverflowingValueFrom(i, rateOfChanges1st, maxNumScans);
    const next1stValue = positionOverflowingValueFrom(i + 1, rateOfChanges1st, maxNumScans);

    const current2ndValue = positionOverflowingValueFrom(i, rateOfChanges2nd, maxNumScans);

    var featureDetected = false;
    if (current1stValue && next1stValue && current2ndValue) {
      if ((current1stValue < 0 && next1stValue >= 0) || (current1stValue >= 0 && next1stValue < 0)) {
        // Sign change
        if (Math.abs(current2ndValue) > 0.1) {
          featureDetected = true;
        }
      }
    }

    csv+= '' + i + ';';
    if (currentFrame[i]) {
      csv+=Math.round(currentFrame[i] * 100);
    }
    csv+=';';
    if (rateOfChanges1st[i]) {
      csv+=Math.round(rateOfChanges1st[i] * 100);
    }
    csv+=';';
    if (rateOfChanges2nd[i]) {
      csv+=Math.round(rateOfChanges2nd[i] * 100);
    }
    csv+=';';
    if (featureDetected)  {
      csv+='Feature';
    }
    csv+='\n';

    const distance = currentFrame[i];
    if (featureDetected && distance) {

      const angle = angles[i];
      const featureLocation = turtleState.location.polarProjection(angle, distance);

      detectedFeatures.push({
        angle: angle - turtleState.theta,
        distance: distance,
        uncertainty: Math.pow(5, 2)
      });

      // Mark Feature on the Map
      context.beginPath();
      context.strokeStyle = 'red';
      context.fillStyle = 'red';
      context.arc(featureLocation.x, featureLocation.y, 2, 0, 2 * Math.PI);
      context.stroke();
      context.closePath();

      context.strokeStyle = 'lightgray';
      context.fillStyle = 'lightgray';
      context.beginPath();
      context.moveTo(turtleState.location.x, turtleState.location.y);
      context.lineTo(featureLocation.x, featureLocation.y);
      context.stroke();
      context.closePath();

      // Mark Feature in Lidar data
      let scanProfileX = 200 + ((i + rotationOffset) % maxNumScans);
      let scanProfileYStart = 90;
      let scanProfileYEnd = scanProfileYStart - rateOfChanges1st[i];

      context.beginPath();
      context.strokeStyle = 'red';
      context.fillStyle = 'red';
      context.arc(scanProfileX, scanProfileYEnd, 2, 0, 2 * Math.PI);
      context.stroke();
      context.closePath();

      // Mark Feature in 1st derivative data
      scanProfileX = 200 + ((i + rotationOffset) % maxNumScans);
      scanProfileYStart = 50;
      scanProfileYEnd = scanProfileYStart - currentFrame[i];

      context.beginPath();
      context.strokeStyle = 'red';
      context.fillStyle = 'red';
      context.arc(scanProfileX, scanProfileYEnd, 2, 0, 2 * Math.PI);
      context.stroke();
      context.closePath();
    }
  }

  dataBlob = new Blob([csv], {type: 'text/csv'});
  const element = document.getElementById('download');
  element.href = window.URL.createObjectURL(dataBlob);
  element.dowload = 'snapshot.csv';

  turtleMindModel.updateParticleState(detectedFeatures);
}

function callback() {
  drawSimulation();
  window.requestAnimationFrame(callback);
}

window.requestAnimationFrame(callback);

window.addEventListener("keydown", function(event) {
  if (event.key === "ArrowUp") {

    const dx = Math.cos(Math.PI / 180 * turtleState.theta) * 3;
    const dy = Math.sin(Math.PI / 180 * turtleState.theta) * 3;

    turtleState.location.translate(dx, dy);

    turtleMindModel.moveTurtleBy(dx, dy)
  }
  if (event.key === "ArrowDown") {
    const dx = Math.cos(Math.PI / 180 * turtleState.theta) * -3;
    const dy =  Math.sin(Math.PI / 180 * turtleState.theta) * -3;

    turtleState.location.translate(dx, dy);

    turtleMindModel.moveTurtleBy(dx, dy)
  }
  if (event.key === "ArrowLeft") {
    turtleState.theta -= 2;

    turtleMindModel.rotateTurtle(-2);
  }
  if (event.key === "ArrowRight") {
    turtleState.theta += 2;

    turtleMindModel.rotateTurtle(2);
  }
});
