const CANVAS_WIDTH  = 800;
const CANVAS_HEIGHT = 600;
const CANVAS_SCALE  = 1;

let g_canvas;
let g_ctxt;
let g_lastFrameTime = -1;

const BUTTON_STATE_UP   = false;
const BUTTON_STATE_DOWN = true;

let g_mouse = {
  x: -1,
  y: -1,
  buttons: [BUTTON_STATE_UP,BUTTON_STATE_UP],
  prevState: {
    x: -1,
    y: -1,
    buttons: [BUTTON_STATE_UP,BUTTON_STATE_UP],
  },

  isDown(button) {
    return this.buttons[button] === BUTTON_STATE_DOWN;
  },

  isUp(button) {
    return this.buttons[button] === BUTTON_STATE_UP;
  },

  wasReleased(button) {
    return this.isUp(button) && this.prevState.buttons[button] === BUTTON_STATE_DOWN;
  },

  wasPressed(button) {
    return this.isDown(button) && this.prevState.buttons[button] === BUTTON_STATE_UP;
  },

  pos() {
    return [this.x, this.y];
  }
};

let g_game = {
  worms: [],
  train: {
    segment_index: 0,
    segment_progress: 0,
    speed: 0.05,
  },
  splitting_point: null,
};

function isWormClosed(worm) {
  const first = worm.points[0];
  const last  = worm.points[worm.points.length-1];
  return first[0] === last[0] && first[1] === last[1];
}

function init() {

  // Create a round worm
  {
    const center_x = 300;
    const center_y = 300;
    const radius = 30;
    const segments = 9;
    const angle_increase = (2 * Math.PI) / (segments-1);
    const points = [];
    for (let i=0; i < segments-1; ++i) {
      const angle = i * angle_increase;
      points.push(point(center_x + Math.cos(angle) * radius,
                        center_y + Math.sin(angle) * radius));
    }
    // Close
    points.push(points[0].slice());
    g_game.worms.push({points});
  }

  // Create a straight worm
  {
    const segments = 9;
    const points = [];
    for (let i=0; i < segments; ++i) {
      points.push(point(400, 200 + i * 20));
    }
    g_game.worms.push({points});
  }
}

function point(x, y) {
  return [x, y];
}

function dist(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx*dx + dy*dy);
}

function dot_product(u, v) {
  return u[0] * v[0] + u[1] * v[1];
}

function vec(a, b) {
  return [b[0] - a[0], b[1] - a[1]];
}

function vlength(v) {
  return dist([0,0], v);
}

function vnorm(v) {
  const l = vlength(v);
  return [v[0] / l, v[1] / l];
}

function vadd(u, v) {
  return [u[0] + v[0], u[1] + v[1]];
}

function vmult(v, s) {
  return [v[0] * s, v[1] * s];
}

function clamp(x, a, b) {
  if (x < a) return a;
  if (x > b) return b;
  return x;
}

// Return a vector W, result of U projected on V and clamped to V
function project_clamped(u, v) {
  const axis = vnorm(v);
  const dot = dot_product(axis, u);
  return vmult(axis, clamp(dot, 0, vlength(v)));
}

function drawPoint(a) {
  g_ctxt.fillStyle = '#ff0';
  g_ctxt.beginPath();
  g_ctxt.arc(a[0], a[1], 8, 0, 2*Math.PI);
  g_ctxt.fill();
}

function drawLine(a, b) {
  g_ctxt.strokeStyle = '#ff0';
  g_ctxt.lineWidth = 4;
  g_ctxt.beginPath();
  g_ctxt.moveTo(a[0], a[1]);
  g_ctxt.lineTo(b[0], b[1]);
  g_ctxt.stroke();
}

function rotateArrayLeft(a, n) {
  while (n-- > 0) {
    let x = a.shift();
    a.push(x);
  }
}

function update(dt) {
  // Pick point on worm closest to mouse
  const pmouse = g_mouse.pos();
  const splitDistanceThreshold = 30;
  let minDistance = Number.MAX_VALUE;
  let closestWorm = null;
  let closestPoint = null;
  let closestPointIndex = 0;

  outer:
  for (let w_i=0, w_len=g_game.worms.length; w_i < w_len; ++w_i) {
    const worm = g_game.worms[w_i];

    if (!isWormClosed(worm))
      continue;

    for (let p_i=0, p_len=worm.points.length-1; p_i < p_len; ++p_i) {
      const p0 = worm.points[p_i + 0];
      const p1 = worm.points[p_i + 1];
      const proj = vadd(p0, project_clamped(vec(p0, pmouse), vec(p0, p1)));

      const d = dist(proj, pmouse);
      if (d < minDistance) {
        minDistance = d;
        closestPoint = proj;
        closestWorm = worm;
        closestPointIndex = p_i+1;
      }
    }
  }

  if (g_mouse.wasPressed(0)) {
    if (minDistance < splitDistanceThreshold) {
      rotateArrayLeft(closestWorm.points, closestPointIndex);
      closestWorm.points.unshift(closestPoint);
      closestWorm.points.push(pmouse);
    }
  }
  else {
    if (minDistance < splitDistanceThreshold) {
      g_game.splitting_point = closestPoint.slice();
    } else {
      g_game.splitting_point = null;
    }
  }

  // Update train
  {
    // let train = g_game.train;
    // train.segment_progress += train.speed;
    // if (train.segment_progress >= 1) {
    //   train.segment_index = (train.segment_index + 1) % g_game.segments.length;
    //   train.segment_progress -= 1;
    // }
  }
}

function lerp(a, b, dt) {
  return a*dt + (1-dt) * b;
}

function render(ctxt) {
  //ctxt.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw worms
  for (let w_i=0, len=g_game.worms.length; w_i < len; ++w_i) {
    const worm = g_game.worms[w_i];
    const points_len = worm.points.length;

    ctxt.strokeStyle = 'white';
    ctxt.lineWidth = 2;
    ctxt.beginPath();
    ctxt.moveTo(worm.points[0][0], worm.points[0][1]);
    for (let p_i=1; p_i < points_len; ++p_i) {
      const p = worm.points[p_i];
      ctxt.lineTo(p[0], p[1]);
    }
    ctxt.stroke();

    // Draw points at segment ends
    if (1) {
      ctxt.fillStyle = '#eee';
      const radius = 3;
      for (let i=0; i < points_len; ++i) {
        const seg = worm.points[i];
        ctxt.beginPath();
        ctxt.arc(seg[0], seg[1], radius, 0, Math.PI*2);
        ctxt.fill();
        //ctxt.fillText(i, seg[0]+5, seg[1]+5);
      }
    }
  }

  // Draw train
  {
    // const train = g_game.train
    // ctxt.fillStyle = '#b00';
    // const p1 = worm.points[train.segment_index];
    // const p0 = worm.points[(train.segment_index + 1) % seg_len];
    // const a = train.segment_progress;
    // const train_x = lerp(p0[0], p1[0], train.segment_progress);
    // const train_y = lerp(p0[1], p1[1], train.segment_progress);
    // ctxt.beginPath();
    // ctxt.arc(train_x, train_y, 6, 0, Math.PI*2);
    // ctxt.fill();
  }

  // Draw splitting point
  if (g_game.splitting_point !== null) {
    ctxt.fillStyle = '#fff';
    ctxt.beginPath();
    ctxt.arc(g_game.splitting_point[0], g_game.splitting_point[1],
             8, 0, 2*Math.PI);
    ctxt.fill();
  }
}

function loop(frameTime) {
  const dt = frameTime - g_lastFrameTime;
  g_lastFrameTime = frameTime;

  g_ctxt.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  update(dt);
  render(g_ctxt);
  swap_input_states();

  requestAnimationFrame(loop);
}

function swap_input_states() {
  g_mouse.prevState.x = g_mouse.x;
  g_mouse.prevState.y = g_mouse.y;
  g_mouse.prevState.buttons = g_mouse.buttons.slice();
}

function onMouseMove(event) {
  g_mouse.x = event.offsetX;
  g_mouse.y = event.offsetY;
}

function onMouseDown(event) {
  if (event.button === 0) {
    g_mouse.buttons[0] = BUTTON_STATE_DOWN;
  }
}

function onMouseUp(event) {
  if (event.button === 0) {
    g_mouse.buttons[0] = BUTTON_STATE_UP;
  }
}

window.addEventListener('DOMContentLoaded', function(main) {
  g_canvas = document.querySelector('canvas');

  g_canvas.addEventListener('mousemove', onMouseMove);
  g_canvas.addEventListener('mousedown', onMouseDown);
  g_canvas.addEventListener('mouseup',   onMouseUp);

  g_canvas.width = CANVAS_WIDTH;
  g_canvas.height= CANVAS_HEIGHT;
  g_canvas.style.width = (CANVAS_WIDTH * CANVAS_SCALE) + "px";
  g_canvas.style.height = (CANVAS_HEIGHT * CANVAS_SCALE) + "px";

  g_ctxt = g_canvas.getContext('2d');
  // Origin in bottom-left corner, Y-axis up
  // g_ctxt.translate(0, CANVAS_HEIGHT);
  // g_ctxt.scale(1, -1);

  init();

  loop();
});
