let canvas;
let ctx;

const mainPath = [[0, 0]];

const otherPaths = [
  [
    [200, 200],
    [300, 200],
    [300, 300],
    [200, 300]
  ],
  [
    [50, 250],
    [75, 350]
  ]
];

let closestTail; // For extending the path, ref to mainPath or one of the otherPaths
let closestHead; // For grabbing a path, ref to mainPath or one of the otherPaths

let dragging = false;

function dist(p1, p2) {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

function update() {
  // Shorten the tail

  let length = 0;

  for (let i = mainPath.length - 1; i > 0; --i) {
    const segmentLength = dist(mainPath[i - 1], mainPath[i]);

    length += segmentLength;

    if (length > options.maxLength) {
      mainPath.splice(0, i - 1);

      // Adjust the tail position
      const t = (options.maxLength - (length - segmentLength)) / segmentLength;

      mainPath[0] = [
        mainPath[1][0] + (mainPath[0][0] - mainPath[1][0]) * t,
        mainPath[1][1] + (mainPath[0][1] - mainPath[1][1]) * t
      ];

      break;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //ctx.fillText(length, 50, 50);

  drawPath(mainPath);
  otherPaths.forEach((p) => drawPath(p));

  if (closestTail) {
    const p = tail(closestTail);

    ctx.strokeStyle = "orangered";
    ctx.beginPath();
    ctx.arc(p[0], p[1], 5, 0, 2 * Math.PI, false);
    ctx.stroke();
  }

  if (closestHead && !dragging) {
    const p = head(closestHead);

    ctx.strokeStyle = "lime";
    ctx.beginPath();
    ctx.arc(p[0], p[1], 5, 0, 2 * Math.PI, false);
    ctx.stroke();
  }
}

function pathLength(path) {
  let length = 0;
  for (let i = 1; i < path.length; ++i) {
    length += dist(path[i - 1], path[i]);
  }
  return length;
}

function drawPath(path) {
  if (path.length < 2) return;

  ctx.strokeStyle = "#6677cc";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(path[0][0], path[0][1]);
  ctx.curve(path.flat(), options.curveTension, options.curveSegments, false);
  ctx.stroke();
}

function addPoint(x, y) {
  mainPath.push([x, y]);
}

function tail(path) {
  return path[0];
}

function head(path) {
  return path[path.length - 1];
}

// Extends path1 with path2
function mergePaths(path1, path2) {
  path1.push(...path2);
}

var options = new (function () {
  this.maxLength = 500;
  this.samplingDistance = 30;
  this.curveTension = 0.5;
  this.curveSegments = 10;
  this.connectionDistance = 30;
})();

document.addEventListener("DOMContentLoaded", (event) => {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  var gui = new dat.GUI();
  gui.add(options, "maxLength", 0, 1000);
  gui.add(options, "samplingDistance", 0, 100);
  gui.add(options, "curveTension", 0, 2).onChange(() => update());
  gui.add(options, "curveSegments", 1, 30).onChange(() => update());
  gui.add(options, "connectionDistance", 0, 100);

  canvas.addEventListener("mousedown", (event) => {
    dragging = true;
    addPoint(event.offsetX, event.offsetY);
    draw(mainPath);
  });

  canvas.addEventListener("mouseup", (event) => {
    dragging = false;

    // Connect?

    if (closestTail) {
      mergePaths(mainPath, closestTail);

      // Delete the merged path
      const index = otherPaths.indexOf(closestTail);
      if (index > -1) otherPaths.splice(index, 1);

      closestTail = null;
      closestHead = null;

      update();
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    const cursor = [event.offsetX, event.offsetY];

    // Look for the closest head to grab

    closestHead = [mainPath].find((path, i) => {
      return dist(head(path), cursor) < options.connectionDistance;
    });

    if (dragging) {
      // Update the head with the cursor pos

      mainPath[mainPath.length - 1] = cursor;

      // Add a new point if far enough

      const d = dist(
        mainPath[mainPath.length - 2],
        mainPath[mainPath.length - 1] // head
      );

      if (d > options.samplingDistance) addPoint(event.offsetX, event.offsetY);

      // Look for the closest tail to connect to

      const pathHead = head(mainPath);

      closestTail = [mainPath, ...otherPaths].find((path, i) => {
        const otherTail = tail(path);

        return dist(pathHead, otherTail) < options.connectionDistance;
      });
    }

    update();
  });

  document.addEventListener("keydown", (event) => {});

  update();
});
