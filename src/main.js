const CANVAS_WIDTH  = 800;
const CANVAS_HEIGHT = 600;
const CANVAS_SCALE  = 1;

let g_options = {
  samplingDistance   : 10,
  curveTension       : 0.5,
  curveSegments      : 10,
  connectionDistance : 10,
  grabDistance       : 30,
  splitDistance      : 10,
  showWormPoints     : false,
  glowSpeed          : 0.002,
  glowIntensity      : 0.3
};

let g_stats;

let g_canvas;
let g_ctxt;
let g_lastFrameTime = -1;

let g_CurrentState = null;

function setState(state) {
  if (g_CurrentState !== null && g_CurrentState.onExit)
    g_CurrentState.onExit(state);
  if (state.onEnter)
    state.onEnter(g_CurrentState);
  g_CurrentState = state;
}

let StateMain = {
  update(dt) {
    // Pick point on worm closest to mouse
    const pmouse = g_mouse.pos();
    let closestSplitPointDistance = Number.MAX_VALUE;
    let closestWormToSplit = null;
    let closestSplittingPoint = null;
    let closestSplittingPointIndex = 0;
    let closestHeadDistance = Number.MAX_VALUE;
    let closestWormToGrab = null;

    for (let w_i=0, w_len=g_game.worms.length; w_i < w_len; ++w_i) {
      const worm = g_game.worms[w_i];

      if (isWormClosed(worm)) {
        // Find closest point to split
        for (let p_i=0, p_len=worm.points.length-1; p_i < p_len; ++p_i) {
          const p0 = worm.points[p_i + 0];
          const p1 = worm.points[p_i + 1];
          const proj = vadd(p0, project_clamped(vec(p0, pmouse), vec(p0, p1)));

          const d = dist(proj, pmouse);
          if (d < closestSplitPointDistance) {
            closestSplitPointDistance = d;
            closestSplittingPoint = proj;
            closestWormToSplit = worm;
            closestSplittingPointIndex = p_i+1;
          }
        }
      } else {
        // Find closest head to grab
        {
          const d = dist(wormHead(worm), pmouse);
          if (d < closestHeadDistance) {
            closestHeadDistance = d;
            closestWormToGrab = worm;
          }
        }
      }
    }

    this.grabbing_point = null;
    this.splitting_point = null;

    if (g_mouse.isUp(0)) {
      if (closestHeadDistance < g_options.grabDistance) {
        this.grabbing_point = wormHead(closestWormToGrab);
      }
      else if (closestSplitPointDistance < g_options.splitDistance) {
        this.splitting_point = closestSplittingPoint.slice();
      }
    } else if (g_mouse.wasPressed(0)) {
      if (closestHeadDistance < g_options.grabDistance) {
        StateDraggingWorm.worm = closestWormToGrab;
        setState(StateDraggingWorm);
      } else if (closestSplitPointDistance < g_options.splitDistance) {
        rotateArrayLeft(closestWormToSplit.points, closestSplittingPointIndex);
        closestWormToSplit.points.unshift(closestSplittingPoint);
        closestWormToSplit.points.push(pmouse);
        StateDraggingWorm.worm = closestWormToSplit;
        setState(StateDraggingWorm);
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

    updateParticles(dt);
  },

  render(ctxt) {
    //drawGrid(ctxt);

    // Draw worms
    for (let w_i=0, len=g_game.worms.length; w_i < len; ++w_i) {
      const worm = g_game.worms[w_i];
      const points_len = worm.points.length;

      // Glow layer

      // pink #ff61fe #ffdeff
      // blue #29dcfd #cff7ff

      const points = worm.points.flat();

      const glow = 0.5 * Math.sin(g_lastFrameTime * g_options.glowSpeed) + 1;

      ctxt.globalCompositeOperation = 'lighter';
      ctxt.filter = 'blur(5px)';
      ctxt.strokeStyle = '#29dcfd';
      ctxt.lineWidth = 10 * (1 - g_options.glowIntensity + g_options.glowIntensity * glow);
      ctxt.beginPath();
      ctxt.moveTo(worm.points[0][0], worm.points[0][1]);
      ctxt.curve(points, g_options.curveTension, g_options.curveSegments, false);
      ctxt.stroke();

      // Core layer

      ctxt.globalCompositeOperation = 'source-over';
      ctxt.filter = 'none';
      ctxt.strokeStyle = '#cff7ff';
      ctxt.lineWidth = 4;
      ctxt.beginPath();
      ctxt.moveTo(worm.points[0][0], worm.points[0][1]);
      ctxt.curve(points, g_options.curveTension, g_options.curveSegments, false);
      ctxt.stroke();

      // Draw points at segment ends
      if (g_options.showWormPoints) {
        ctxt.fillStyle = '#eee';
        const radius = 3;
        for (let i=0; i < points_len; ++i) {
          const seg = worm.points[i];
          ctxt.beginPath();
          ctxt.arc(seg[0], seg[1], radius, 0, Math.PI*2);
          ctxt.fill();
        }
      }

      g_game.particleSystems.forEach(system => system.draw(ctxt));
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

    // Draw interaction points
    if (this.grabbing_point !== null) {
      ctxt.strokeStyle = 'lime';
      ctxt.beginPath();
      ctxt.arc(this.grabbing_point[0], this.grabbing_point[1],
               5, 0, 2*Math.PI);
      ctxt.stroke();
    }
    if (this.splitting_point !== null) {
      ctxt.strokeStyle = '#fff';
      ctxt.beginPath();
      ctxt.arc(this.splitting_point[0], this.splitting_point[1],
               5, 0, 2*Math.PI);
      ctxt.stroke();
    }
  },

  onExit() {
    this.grabbing_point = null;
    this.splitting_point = null;
  },
};

let StateDraggingWorm = {
  worm: null,
  connecting_point: null,

  update(dt) {
    let pmouse = g_mouse.pos();
    let closestTailDistance = Number.MAX_VALUE;
    let closestWormToConnect = null;

    for (let w_i=0, w_len=g_game.worms.length; w_i < w_len; ++w_i) {
      const worm = g_game.worms[w_i];

      if (!isWormClosed(worm)) {
        // Find closest tail to connect
        const d = dist(wormTail(worm), pmouse);
        if (d < closestTailDistance) {
          closestTailDistance = d;
          closestWormToConnect = worm;
        }
      }
    }

    if (g_mouse.isDown(0)) {
      if (closestTailDistance < g_options.connectionDistance) {
        this.connecting_point = wormTail(closestWormToConnect);
      }
      else {
        this.connecting_point = null;
      }

      // Add new head if distance is > threshold
      const d = dist(wormHead(this.worm), pmouse);
      if (d > g_options.samplingDistance) {
        this.worm.points.push(pmouse);
      }

      // Shorten tail
      const path = this.worm.points;
      const maxLength = this.worm.length;
      let length = dist(pmouse, wormHead(this.worm)); // Add the distance to the cursor
      for (let i = path.length - 1; i > 0; --i) {
        const segmentLength = dist(path[i - 1], path[i]);

        length += segmentLength;

        if (length > maxLength) {
          path.splice(0, i - 1);

          // Adjust the tail position
          const t = (maxLength - (length - segmentLength)) / segmentLength;

          path[0] = point(
            path[1][0] + (path[0][0] - path[1][0]) * t,
            path[1][1] + (path[0][1] - path[1][1]) * t
          );

          break;
        }
      }
    }
    else if (g_mouse.wasReleased(0)) {
      if (closestTailDistance < g_options.connectionDistance) {
        if (this.worm == closestWormToConnect) {
          // Trying to connect to one's own tail, close the worm instead
          this.worm.points[0] = wormHead(this.worm).slice();
        }
        else {
          mergeWorm(this.worm, closestWormToConnect);

          // Delete the merged path
          const index = g_game.worms.indexOf(closestWormToConnect);
          if (index > -1)
            g_game.worms.splice(index, 1);
        }
      }

      setState(StateMain);
    }

    updateParticles(dt);
  },

  render(ctxt) {
    StateMain.render(ctxt);

    // Connect head to mouse cursor
    const head = wormHead(this.worm);
    const pmouse = g_mouse.pos();

    ctxt.strokeStyle = 'white';
    ctxt.lineWidth = 2;
    ctxt.beginPath();
    ctxt.moveTo(head[0], head[1]);
    ctxt.lineTo(pmouse[0], pmouse[1]);
    ctxt.stroke();

    if (this.connecting_point != null ) {
      ctxt.strokeStyle = "orangered";
      ctxt.beginPath();
      ctxt.arc(this.connecting_point[0], this.connecting_point[1],
               5, 0, 2*Math.PI);
      ctxt.stroke();
    }
  },

  onExit() {
    this.connecting_point = null;
  },
};

function updateParticles(dt)
{
    g_game.particleSystems.forEach(system => system.update(dt));
    g_game.particleSystems = g_game.particleSystems.filter(system => !system.empty());
}

function drawGrid(ctx)
{
  for (let y = 50; y < g_canvas.height; ++y)
  {
    ctx.moveTo(0, y);
    ctx.lineTo(g_canvas.width, y);
  }

  for (let x = 50; x < g_canvas.width; ++x)
  {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, g_canvas.height);
  }
}

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
  particleSystems: []
};

function isWormClosed(worm) {
  const head = wormHead(worm);
  const tail  = wormTail(worm);
  return head[0] === tail[0] && head[1] === tail[1];
}

function wormHead(worm) {
  return worm.points[worm.points.length-1];
}

function wormTail(worm) {
  return worm.points[0];
}

function wormLength(worm) {
  let length = 0;
  const path = worm.points
  for (let i = 1; i < path.length; ++i) {
    length += dist(path[i - 1], path[i]);
  }
  return length;
}

function mergeWorm(a, b) {
  a.points.push(...b.points);
  a.length += b.length;
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
    let worm = {points};
    worm.length = wormLength(worm);
    g_game.worms.push(worm);
  }

  // Create a straight worm
  {
    const segments = 9;
    const points = [];
    for (let i=0; i < segments; ++i) {
      points.push(point(400, 200 + i * 20));
    }
    let worm = {points};
    worm.length = wormLength(worm);
    g_game.worms.push(worm);
  }

  setState(StateMain);
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
  g_CurrentState.update(dt);
}

function lerp(a, b, dt) {
  return a*dt + (1-dt) * b;
}

function render(ctxt) {
  ctxt.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  g_CurrentState.render(ctxt);
}

function loop(frameTime) {
  g_stats.begin();

  const dt = frameTime - g_lastFrameTime;
  g_lastFrameTime = frameTime;

  g_ctxt.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  update(dt);
  render(g_ctxt);
  swap_input_states();

  g_stats.end();

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

  event.preventDefault();
  return false;
}

function onMouseUp(event) {
  if (event.button === 0) {
    g_mouse.buttons[0] = BUTTON_STATE_UP;
  }

  event.preventDefault();
  return false;
}

function onKeyUp(event) {
  g_game.particleSystems.push(makeExplosion([200, 200], 10));

  event.preventDefault();
  return false;
}


window.addEventListener('DOMContentLoaded', function(main) {
  g_canvas = document.querySelector('canvas');

  g_stats = new Stats();
  g_stats.showPanel(0);
  document.body.appendChild(g_stats.dom);

  var gui = new dat.GUI();

  const curveOptions = gui.addFolder('Curve sampling');
  curveOptions.open();
  curveOptions.add(g_options, "samplingDistance", 0, 100);
  curveOptions.add(g_options, "curveTension", 0, 2);
  curveOptions.add(g_options, "curveSegments", 1, 30);

  const controlsOptions = gui.addFolder('Controls');
  controlsOptions.open();
  controlsOptions.add(g_options, "connectionDistance", 0, 100);
  controlsOptions.add(g_options, "grabDistance", 0, 100);
  controlsOptions.add(g_options, "splitDistance", 0, 100);

  const renderOptions = gui.addFolder('Rendering');
  renderOptions.open();
  renderOptions.add(g_options, "showWormPoints");
  renderOptions.add(g_options, "glowSpeed", 0, 0.01);
  renderOptions.add(g_options, "glowIntensity", 0, 1);

  g_canvas.addEventListener('mousemove', onMouseMove);
  g_canvas.addEventListener('mousedown', onMouseDown);
  g_canvas.addEventListener('mouseup',   onMouseUp);
  g_canvas.addEventListener('mousewheel',     onKeyUp);

  g_canvas.width = CANVAS_WIDTH;
  g_canvas.height= CANVAS_HEIGHT;
  g_canvas.style.width = (CANVAS_WIDTH * CANVAS_SCALE) + "px";
  g_canvas.style.height = (CANVAS_HEIGHT * CANVAS_SCALE) + "px";

  g_ctxt = g_canvas.getContext('2d');

  init();

  loop();
});
