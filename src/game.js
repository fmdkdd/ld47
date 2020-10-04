'use strict';

let g_game = {
  worms: [],
  trains: [],
  particleSystems: [],
  loopNodes: [],
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// StateMain

let StateMain = {
  grabbingPoint: null,
  splittingPoint: null,

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

      // Check node loops
      for (let node of g_game.loopNodes)
      {
        if (node.isSurrounded(worm))
        {
          console.log('surrounded');
        }
      }
    }

    this.grabbingPoint = null;
    this.splittingPoint = null;

    if (g_mouse.isUp(0)) {
      if (closestHeadDistance < g_options.grabDistance) {
        this.grabbingPoint = wormHead(closestWormToGrab);
      }
      else if (closestSplitPointDistance < g_options.splitDistance) {
        this.splittingPoint = closestSplittingPoint.slice();
      }
    } else if (g_mouse.wasPressed(0)) {
      if (closestHeadDistance < g_options.grabDistance) {
        StateDraggingWorm.worm = closestWormToGrab;
        setState(StateDraggingWorm);
      } else if (closestSplitPointDistance < g_options.splitDistance) {
        // Save train screen positions to adjust it later
        let savedTrainsScreenPos = [];
        for (let train of getTrainsOnWorm(closestWormToSplit)) {
          savedTrainsScreenPos.push(getTrainScreenPos(train));
        }

        const path = closestWormToSplit.points;
        // Pop redundant head
        path.pop();
        // Rotate so that empty segment is on point to split
        rotateArrayLeft(path, closestSplittingPointIndex);
        // New tail, nead head to create opening
        path.unshift(closestSplittingPoint);
        path.push(pmouse);

        // Adjust trains positions
        adjustTrainPositions(closestWormToSplit, savedTrainsScreenPos);

        StateDraggingWorm.worm = closestWormToSplit;
        setState(StateDraggingWorm);
      }
    }

    updateTrains(dt);

    updateLoopNodes(dt);
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
          ctxt.fillText(i, seg[0]+3, seg[1]+3);
        }
      }

      g_game.particleSystems.forEach(system => system.render(ctxt));
      g_game.loopNodes.forEach(node => node.render(ctxt));

      renderTrains(ctxt);
    }

    // Draw interaction points
    if (this.grabbingPoint !== null) {
      ctxt.strokeStyle = 'lime';
      ctxt.beginPath();
      ctxt.arc(this.grabbingPoint[0], this.grabbingPoint[1],
               5, 0, 2*Math.PI);
      ctxt.stroke();
    }
    if (this.splittingPoint !== null) {
      ctxt.strokeStyle = '#fff';
      ctxt.beginPath();
      ctxt.arc(this.splittingPoint[0], this.splittingPoint[1],
               5, 0, 2*Math.PI);
      ctxt.stroke();
    }
  },

  onExit() {
    this.grabbingPoint = null;
    this.splittingPoint = null;
  },
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// StateDraggingWorm

let StateDraggingWorm = {
  worm: null,
  connectingPoint: null,

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
        this.connectingPoint = wormTail(closestWormToConnect);
      }
      else {
        this.connectingPoint = null;
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
          // Save train screen positions to adjust it later
          let savedTrainsScreenPos = [];
          for (let train of getTrainsOnWorm(this.worm)) {
            savedTrainsScreenPos.push(getTrainScreenPos(train));
          }

          path.splice(0, i - 1);

          // Adjust the tail position
          const t = (maxLength - (length - segmentLength)) / segmentLength;

          path[0] = point(
            path[1][0] + (path[0][0] - path[1][0]) * t,
            path[1][1] + (path[0][1] - path[1][1]) * t
          );

          // Adjust trains positions
          adjustTrainPositions(this.worm, savedTrainsScreenPos);
          break;
        }
      }
    }
    else if (g_mouse.wasReleased(0)) {
      if (closestTailDistance < g_options.connectionDistance) {
        // Save train screen positions to adjust it later
        let savedTrainsScreenPos = [];
        for (let train of getTrainsOnWorm(closestWormToConnect)) {
          savedTrainsScreenPos.push(getTrainScreenPos(train));
        }


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

        // Adjust trains positions after merge
        adjustTrainPositions(this.worm, savedTrainsScreenPos);
      }

      setState(StateMain);
    }

    updateTrains(dt);

    updateLoopNodes(dt);
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

    if (this.connectingPoint != null ) {
      ctxt.strokeStyle = "orangered";
      ctxt.beginPath();
      ctxt.arc(this.connectingPoint[0], this.connectingPoint[1],
               5, 0, 2*Math.PI);
      ctxt.stroke();
    }
  },

  onExit() {
    this.connectingPoint = null;
  },
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// StateGameover

let StateGameover = {
  update(dt) {
    if (g_mouse.wasReleased(0)) {
      gameInit();
    }
  },

  render(ctxt) {
    StateMain.render(ctxt);
    ctxt.fillStyle = 'rgba(0,0,0,0.8)';
    ctxt.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctxt.fillStyle = "#fff";
    ctxt.font = '48px sans-serif';
    ctxt.fillText("Click to retry", 300, 300);
  },
};

function getTrainScreenPos(train) {
  const worm = g_game.worms[train.wormIndex];
  const path = worm.points;
  const a = path[Math.trunc(train.pos) + 0];
  const b = path[Math.trunc(train.pos) + 1];
  const frac = train.pos - Math.trunc(train.pos);
  const x = lerp(a[0], b[0], frac);
  const y = lerp(a[1], b[1], frac);
  return point(x, y);
}

function adjustTrainPositions(worm, savedTrainsScreenPos) {
  const trains = getTrainsOnWorm(worm);
  const path = worm.points;
  for (let t_i=0, l=savedTrainsScreenPos.length; t_i < l; ++t_i) {
    let closestPoint = null;
    let closestSegmentIndex = 0;
    let minDistance = Number.MAX_VALUE;
    const trainScreenPos = savedTrainsScreenPos[t_i];

    // Projected train pos onto new path, keep closest
    for (let p_i=0, p_len=path.length-1; p_i < p_len; ++p_i) {
      const p0 = path[p_i + 0];
      const p1 = path[p_i + 1];
      const proj = vadd(p0, project_clamped(vec(p0, trainScreenPos), vec(p0, p1)));
      const d = dist(proj, trainScreenPos);
      if (d < minDistance) {
        minDistance = d;
        closestPoint = proj;
        closestSegmentIndex = p_i;
      }
    }

    // Convert closest point back to train pos
    const p0 = path[closestSegmentIndex + 0];
    const p1 = path[closestSegmentIndex + 1];
    const frac = vlength(vec(p0, closestPoint)) / vlength(vec(p0, p1));
    trains[t_i].pos = closestSegmentIndex + frac;
  }
}

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
  const path = worm.points;
  for (let i = 1; i < path.length; ++i) {
    length += dist(path[i - 1], path[i]);
  }
  return length;
}

function mergeWorm(a, b) {
  a.points.push(...b.points);
  a.length += b.length;
}

function getTrainsOnWorm(worm) {
  const idx = g_game.worms.indexOf(worm);
  const trains = [];
  for (const t of g_game.trains) {
    if (t.wormIndex == idx)
      trains.push(t);
  }
  return trains;
}

function gameInit() {
  g_game.worms.length = 0;
  g_game.trains.length = 0;
  g_game.loopNodes.length = 0;

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

  // Add a train to round worm
  {
    let train = {
      wormIndex: 0,
      pos: 0,
      hasCrashed: false,
      speed: g_options.trainSpeed,
    };
    g_game.trains.push(train);
  }

  // Test loop node
  {
    let node = new LoopNode(point(500, 500));
    g_game.loopNodes.push(node);
  }

  setState(StateMain);
}

function rotateArrayLeft(a, n) {
  while (n-- > 0) {
    let x = a.shift();
    a.push(x);
  }
}

function updateTrains(dt) {
  for (let train of g_game.trains) {
    if (train.hasCrashed)
      continue;

    const worm = g_game.worms[train.wormIndex];
    const path = worm.points;
    const max_pos = path.length - 1;
    // Normalize speed by segment length so that the train
    // always advances at the same speed regardless of segment length
    const a = path[Math.trunc(train.pos) + 1];
    const b = path[Math.trunc(train.pos) + 0];
    train.pos += train.speed / dist(a, b);
    if (train.pos >= max_pos) {
      if (isWormClosed(worm)) {
        train.pos -= max_pos;
      }
      else {
        train.hasCrashed = true;
        setState(StateGameover);
      }
    }
  }
}

function renderTrains(ctxt) {
  for (const train of g_game.trains) {
    if (train.hasCrashed)
      continue;

    const worm = g_game.worms[train.wormIndex];
    ctxt.fillStyle = '#b00';

    const pos = getTrainScreenPos(train);
    ctxt.beginPath();
    ctxt.arc(pos[0], pos[1], 6, 0, Math.PI*2);
    ctxt.fill();
  }
}
