'use strict';

let g_game = {
  objects: {},
  worms: [],
  trains: [],
  loopNodes: [],
  obstacles: [],
  doors: [],
  wires: [],
  animations: [],
  grid: null,
  screenshake: null
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// StateMain

let StateMain = {
  grabbingPoint: null,
  splittingPoint: null,

  update(dt) {
    // Pick point on worm closest to mouse
    const pmouse = g_mouse.pos();
    let closestSplit = {
      distance: Number.MAX_VALUE,
      worm: null,
      point: null,
      pointIndex: 0,
    };
    let closestGrab = {
      distance: Number.MAX_VALUE,
      worm: null,
      tailGrab: false,
      point: null,
    };

    for (let w_i=0, w_len=g_game.worms.length; w_i < w_len; ++w_i) {
      const worm = g_game.worms[w_i];

      if (isWormClosed(worm)) {
        // Find closest point to split
        for (let p_i=0, p_len=worm.points.length-1; p_i < p_len; ++p_i) {
          const p0 = worm.points[p_i + 0];
          const p1 = worm.points[p_i + 1];
          const proj = vadd(p0, project_clamped(vec(p0, pmouse), vec(p0, p1)));

          const d = dist(proj, pmouse);
          if (d < closestSplit.distance) {
            closestSplit.distance = d;
            closestSplit.worm = worm;
            closestSplit.point = proj;
            closestSplit.pointIndex = p_i+1;
          }
        }
      } else {
        // Find head to grab
        const d = dist(wormHead(worm), pmouse);
        if (d < closestGrab.distance) {
          closestGrab.distance = d;
          closestGrab.worm = worm;
          closestGrab.tailGrab = false;
          closestGrab.point = wormHead(worm);
        }
        // If worm is inert, we can also grab the tail
        if (getTrainsOnWorm(worm).length === 0) {
          const d = dist(wormTail(worm), pmouse);
          if (d < closestGrab.distance) {
            closestGrab.distance = d;
            closestGrab.worm = worm;
            closestGrab.tailGrab = true;
            closestGrab.point = wormTail(worm);
          }
        }
      }
    }

    this.grabbingPoint = null;
    this.splittingPoint = null;

    if (g_mouse.isUp(0)) {
      if (closestGrab.distance < g_options.grabDistance) {
        this.grabbingPoint = closestGrab.point;
      }
      else if (closestSplit.distance < g_options.splitDistance) {
        this.splittingPoint = closestSplit.point.slice();
      }
    } else if (g_mouse.wasPressed(0)) {
      if (closestGrab.distance < g_options.grabDistance) {
        StateDraggingWorm.worm = closestGrab.worm;
        if (closestGrab.tailGrab) {
          closestGrab.worm.points.reverse();
        }
        setState(StateDraggingWorm);
      } else if (closestSplit.distance < g_options.splitDistance) {
        // Save train screen positions to adjust it later
        let savedTrainsScreenPos = [];
        for (let train of getTrainsOnWorm(closestSplit.worm)) {
          savedTrainsScreenPos.push(getTrainScreenPos(train));
        }

        const path = closestSplit.worm.points;
        // Pop redundant head
        path.pop();
        // Rotate so that empty segment is on point to split
        rotateArrayLeft(path, closestSplit.pointIndex);
        // New tail, nead head to create opening
        path.unshift(closestSplit.point);
        path.push(pmouse);

        // Adjust trains positions
        adjustTrainPositions(closestSplit.worm, savedTrainsScreenPos);

        StateDraggingWorm.worm = closestSplit.worm;
        setState(StateDraggingWorm);
      }
    }

    checkObstacles();

    updateTrains(dt);

    updateObstacles(dt);
    updateLoopNodes(dt);
    updateDoors(dt);
    updateWires(dt);
    updateAnimations(dt);
    g_game.grid.update(dt);
    g_game.screenshake.update(dt);
  },

  render(ctxt) {

    g_game.grid.render(ctxt);

    g_game.screenshake.render(ctxt);

    // Draw worms
    for (let w_i=0, len=g_game.worms.length; w_i < len; ++w_i) {
      const worm = g_game.worms[w_i];
      const points_len = worm.points.length;

      let danger = 0;
      if (!isWormClosed(worm)) {
        danger = computeDangerForWorm(worm);
      }
      let [strokeColor, glowColor] = getWormColors(danger);
      drawPath(ctxt, worm.points, strokeColor, glowColor);

      // Draw debug points
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
    }

    g_game.wires.forEach(wire => wire.render(ctxt));
    g_game.loopNodes.forEach(node => node.render(ctxt));
    g_game.doors.forEach(door => door.render(ctxt));
    g_game.obstacles.forEach(obs => obs.render(ctxt));
    g_game.animations.forEach(system => system.render(ctxt));

    renderTrains(ctxt);

    // Draw interaction points

    const strokeColor = g_colors['blue'][0];
    const glowColor = g_colors['blue'][1];

    if (this.grabbingPoint !== null) {
      drawPoint(ctxt, this.grabbingPoint, 6, strokeColor, glowColor);
    }

    if (this.splittingPoint !== null) {
      drawPoint(ctxt, this.splittingPoint, 6, strokeColor, BACKGROUND_COLOR, false);
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
    let closestConnect = {
      distance: Number.MAX_VALUE,
      point: null,
      worm: null,
      headConnect: false,
    };

    for (let w_i=0, w_len=g_game.worms.length; w_i < w_len; ++w_i) {
      const worm = g_game.worms[w_i];

      // Can only connect to open worms
      if (!isWormClosed(worm)) {
        const d = dist(wormTail(worm), pmouse);
        if (d < closestConnect.distance) {
          closestConnect.distance = d;
          closestConnect.worm = worm;
          closestConnect.point = wormTail(worm);
          closestConnect.headConnect = false;
        }
        // If worm is inert, can also connect to head
        if (worm !== this.worm && getTrainsOnWorm(worm).length === 0) {
          const d = dist(wormHead(worm), pmouse);
          if (d < closestConnect.distance) {
            closestConnect.distance = d;
            closestConnect.worm = worm;
            closestConnect.point = wormHead(worm);
            closestConnect.headConnect = true;
          }
        }
      }
    }

    checkObstacles();

    if (g_mouse.isDown(0)) {
      if (closestConnect.distance < g_options.connectionDistance) {
        this.connectingPoint = closestConnect.point;
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
            // Crash trains that are on track that is to be deleted
            if (Math.trunc(train.pos) < i - 1)
            {
              crashTrain(train)
              setState(StateGameover);
              return;
            } else
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
      // Add points at mouse position
      this.worm.points.push(pmouse);

      if (closestConnect.distance < g_options.connectionDistance) {
        // Save train screen positions to adjust it later
        let savedTrainsScreenPos = [];
        for (let train of getTrainsOnWorm(closestConnect.worm)) {
          savedTrainsScreenPos.push(getTrainScreenPos(train));
        }

        if (this.worm === closestConnect.worm) {
          // Trying to connect to one's own tail, close the worm instead
          this.worm.points[0] = wormHead(this.worm).slice();
        }
        else {
          mergeWorm(this.worm, closestConnect.worm, closestConnect.headConnect);

          // Delete the merged path
          const index = g_game.worms.indexOf(closestConnect.worm);
          if (index > -1)
            g_game.worms.splice(index, 1);

          // Move trains of deleted worm to merged worm
          for (let train of getTrainsOnWorm(closestConnect.worm)) {
            train.wormId = this.worm.id;
          }
        }

        // Adjust trains positions after merge
        adjustTrainPositions(this.worm, savedTrainsScreenPos);
      }

      setState(StateMain);
    }

    updateTrains(dt);

    updateObstacles(dt);
    updateLoopNodes(dt);
    updateDoors(dt);
    updateWires(dt);
    updateAnimations(dt);
    g_game.grid.update(dt);
    g_game.screenshake.update(dt);
  },

  render(ctxt) {
    StateMain.render(ctxt);

    /*
    // Connect head to mouse cursor
    const head = wormHead(this.worm);
    const pmouse = g_mouse.pos();

    ctxt.strokeStyle = 'white';
    ctxt.lineWidth = 2;
    ctxt.beginPath();
    ctxt.moveTo(head[0], head[1]);
    ctxt.lineTo(pmouse[0], pmouse[1]);
    ctxt.stroke();
    */

    if (this.connectingPoint != null ) {
      drawPoint(ctxt, this.connectingPoint, 6, g_colors['blue'][0], BACKGROUND_COLOR, false);
    }

    if (g_options.showWormLength) {
      ctxt.font = '20px sans';
      const staticLength = this.worm.length;
      const dynamicLength = wormLength(this.worm);
      ctxt.fillText(`${staticLength}\n${dynamicLength}`, 0, 20);
    }
  },

  onExit() {
    this.connectingPoint = null;
  },
};


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Level finished

let StateLevelOver = {

  explosionDuration: 0,
  fadeOutDuration: 500,
  fadeInDuration: 1000,
  pauseDuration: 600,

  onEnter(state) {

    /*g_game.worms.forEach(e => {
      g_game.animations.push(new WormExplosion(e.points, 'blue'));
    });

    g_game.obstacles.forEach(e => {
      g_game.animations.push(new WormExplosion(e.getPoints(), e.color));
    });

    g_game.doors.forEach(e => {
      const points = e.getPoints();
      g_game.animations.push(new WormExplosion(points[0], e.color))
      g_game.animations.push(new WormExplosion(points[1], e.color))
    });

    g_game.loopNodes.forEach(e => {
      g_game.animations.push(makeExplosion(e.pos, 10));
    });

    g_game.trains.forEach(e => {
      g_game.animations.push(makeExplosion(getTrainScreenPos(e), 10));
    });

    g_game.worms.length = 0;
    g_game.obstacles.length = 0;
    g_game.doors.length = 0;
    g_game.loopNodes.length = 0;
    g_game.trains.length = 0;*/

    this.age = 0;
    this.fadeOut = true;
    this.fadeIn = false;
    this.levelLoaded = false;
  },

  update(dt) {

    this.age += dt;

    // 3 - End
    if (this.age > this.explosionDuration + this.fadeOutDuration + this.fadeInDuration + this.pauseDuration)
    {
      setState(StateMain);
    }

    // 3 - Final pause
    if (this.age > this.explosionDuration + this.fadeOutDuration + this.fadeInDuration)
    {
      this.fadeIn = false;
    }

    // 2 - Load level & fade in
    else if (this.age > this.explosionDuration + this.fadeOutDuration)
    {
      this.fadeOut = false;
      this.fadeIn = true;

      if (!this.levelLoaded)
      {
        loadLevel(++g_currentLevel);
        this.levelLoaded = true;
      }
    }

    // 1 - Fade out
    /*else if (this.age > this.explosionDuration)
    {
      this.fadeOut = true;
    }*/

    g_game.grid.update(dt);
    updateAnimations(dt);
  },

  render(ctxt) {
    StateMain.render(ctxt);

    if (this.fadeOut || this.fadeIn)
    {
      const progress = this.fadeOut ?
        (this.age - this.explosionDuration) / this.fadeOutDuration :
        1 - (this.age - (this.explosionDuration + this.fadeOutDuration)) / this.fadeInDuration;

      ctxt.globalAlpha = progress;
      ctxt.fillStyle = BACKGROUND_COLOR;
      ctxt.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctxt.globalAlpha = 1;
    }

    /*ctxt.fillStyle = 'rgba(0,0,0,0.8)';
    ctxt.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctxt.fillStyle = "#fff";
    ctxt.font = '48px sans-serif';
    ctxt.fillText("Level over", 300, 300);*/
  },
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// StateGameover

let StateGameover = {

  onEnter() {
    showRetryButton(true);
  },

  update(dt) {
    /*if (g_mouse.wasPressed(0)) {
      gameInit();
    }*/

    StateMain.update(dt);
  },

  render(ctxt) {
    StateMain.render(ctxt);
    /*ctxt.fillStyle = 'rgba(0,0,0,0.8)';
    ctxt.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctxt.fillStyle = "#fff";
    ctxt.font = '48px sans-serif';
    ctxt.fillText("Click to retry", 300, 300);*/
  },
};

function crashTrain(train)
{
  train.hasCrashed = true;

  g_game.animations.push(makeTrainExplosion(getTrainScreenPos(train), 10));
}

function getTrainScreenPos(train) {
  const worm = getObject(train.wormId);
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

  // If we are currently dragging this worm, we need to account for the
  // head->mouse segment
  //
  // FIXME: if the head->mouse segment is shortened by moving the mouse into the
  // head after the tail has been popped off, the total length will be shorter
  // than the static length.  However, the static length will be restored
  // when sampling new points.
  if (g_CurrentState === StateDraggingWorm && worm === StateDraggingWorm.worm) {
    length += dist(g_mouse.pos(), wormHead(worm));
  }

  return length;
}

function mergeWorm(a, b, reverse) {
  if (reverse) {
    b.points.reverse();
  }
  a.points.push(...b.points);
  a.length += b.length;
}

let g_globalIdCounter = 0;

function genId() {
  return g_globalIdCounter++;
}

function registerObject(obj) {
  if (g_game.objects[obj.id]) {
    throw `ID ${obj.id} already registered`;
  } else {
    g_game.objects[obj.id] = obj;
  }
}

function unregisterObject(obj) {
  if (g_game.objects[obj.id] == null)
    throw `No object at id ${obj.id}`;
  else
    delete g_game.objects[obj.id];
}

function getObject(id) {
  if (g_game.objects[id] == null)
    throw `No object at id ${id}`;
  else
    return g_game.objects[id];
}

function getTrainsOnWorm(worm) {
  const trains = [];
  for (const t of g_game.trains) {
    if (t.wormId === worm.id)
      trains.push(t);
  }
  return trains;
}

function createWorm(points) {
  const worm = {
    id: genId(),
    points,
  };
  worm.length = wormLength(worm);
  registerObject(worm);
  return worm;
}

function createRoundWorm(x, y, radius, segments) {
  const angle_increase = (2 * Math.PI) / (segments-1);
  const points = [];
  for (let i=0; i < segments-1; ++i) {
    const angle = i * angle_increase;
    points.push(point(x + Math.cos(angle) * radius,
                      y + Math.sin(angle) * radius));
  }
  // Close
  points.push(points[0].slice());
  return createWorm(points);
}

function createTrain(wormId) {
  assert(getObject(wormId) != null);
  const train = {
    id: genId(),
    wormId,
    pos: 0,
    hasCrashed: false,
    speed: g_options.trainSpeed,
  };
  registerObject(train);
  return train;
}

function resetGameState() {
  g_game.objects = {};
  g_game.worms.length = 0;
  g_game.trains.length = 0;
  g_game.animations.length = 0;
  g_game.loopNodes.length = 0;
  g_game.obstacles.length = 0;
  g_game.doors.length = 0;
  g_game.wires.length = 0;

  showRetryButton(false);
}

function createStraightWorm(x, y, segments, dir) {
  let points = [];
  for (let i=0; i < segments; ++i) {
    const d = i * g_options.samplingDistance;
    if (dir === 'x')
      points.push(point(x + d, y));
    else
      points.push(point(x, y + d));
  }
  return createWorm(points);
}

function testLevel() {
  resetGameState();

  g_game.grid = new Grid();
  g_game.screenshake = new ScreenShake();

  // Round worms
  g_game.worms.push(createRoundWorm(300, 300, 30, 9));
  g_game.worms.push(createRoundWorm(100, 100, 40, 9));
  g_game.worms.push(createRoundWorm(500, 200, 20, 9));

  // Create a straight worm
  g_game.worms.push(createStraightWorm(400, 200, 9));

  // Add a train to round worm
  g_game.trains.push(createTrain(g_game.worms[0].id));
  g_game.trains.push(createTrain(g_game.worms[1].id));
  g_game.trains.push(createTrain(g_game.worms[2].id));

  // Test loop node
  {
    let node = new LoopNode(point(500, 500), 10, 'orange', true);
    g_game.loopNodes.push(node);

    g_game.loopNodes.push(makeEndLevelNode(point(600, 100), 10, 'blue', true));
  }

  // Obstacles
  {
    /*{
      const wave = [];
      for (let i = 0; i < 100; ++i)
        wave.push(point(i * 10, 200 + Math.sin(i * 0.2) * 50))
      wave.push(point(1000, -100));
      wave.push(point(0, -100));

      g_game.obstacles.push(new Obstacles(wave, 'orange'));
    }

    {
      const wave = [];
      for (let i = 0; i < 100; ++i)
        wave.push(point(i * 10, 300 + Math.sin(i * 0.2) * 50))
      wave.push(point(1000, 1100));
      wave.push(point(0, 1100));

      g_game.obstacles.push(new Obstacles(wave, 'orange'));
    }*/

    const topWall = new Obstacles([
      point(-50, -50),
      point(1000, -50),
      point(1000, 50),
      point(-50, 20)
    ], 'pink');
    topWall.motor = new TranslationMotor(point(10, 20), 2000);
    g_game.obstacles.push(topWall);

    const leftWall = new Obstacles([
      point(-50, -50),
      point(50, -50),
      point(10, 1000),
      point(-50, 1000)
    ], 'blue');
    leftWall.motor = new RotationMotor(-0.8, point(0, 0), 2000);
    g_game.obstacles.push(leftWall);
  }

  // Triggered door
  {
    const door = new Door(point(600, 400), 50, 0.001, 'pink');
    g_game.doors.push(door);

    const node = new LoopNode(point(300, 450), 20, 'pink');
    g_game.loopNodes.push(node);

    const wire = new Wire(node, door);
    g_game.wires.push(wire);

    let x = 50;
    for (let color in g_colors)
    {
      g_game.doors.push(new Door(point(x, 400), 50, 0.001, color));
      g_game.doors[g_game.doors.length - 1].powered = false;
      x += 40;
      g_game.doors.push(new Door(point(x, 400), 50, 0.001, color));
      x += 50;
    }
  }

  setState(StateMain);
}

let StateIntro = {
  update(dt) {
    if (g_mouse.wasPressed(0)) {
      loadLevel(g_currentLevel);
      setState(StateMain);
      playAudio('bgm', true);
    }
  },

  render(ctxt) {
    ctxt.fillStyle = '#fff';
    ctxt.font = '48px sans';
    ctxt.fillText('Click to start', 250, 300);
  }
};

function gameInit() {
  setState(StateIntro);

  //testLevel();
}

function updateObstacles(dt)
{
  g_game.obstacles.forEach(obs => obs.update(dt));
}

function updateLoopNodes(dt)
{
  g_game.loopNodes.forEach(node => node.update(dt));
}

function updateDoors(dt)
{
  g_game.doors.forEach(door => door.update(dt));
}

function updateWires(dt)
{
  g_game.wires.forEach(wire => wire.update(dt));
}

function  updateAnimations(dt)
{
  g_game.animations.forEach(anim => anim.update(dt));
  g_game.animations = g_game.animations.filter(anim => !anim.done());
}

function rotateArrayLeft(a, n) {
  while (n-- > 0) {
    let x = a.shift();
    a.push(x);
  }
}

function updateTrains(dt) {
  outer:
  for (let train of g_game.trains) {
    if (train.hasCrashed)
      continue;

    const worm = getObject(train.wormId);
    const path = worm.points;
    const max_pos = path.length - 1;
    // Normalize speed by segment length so that the train
    // always advances at the same speed regardless of segment length
    let d;
    while (true) {
      const currentPointIndex = Math.trunc(train.pos);
      let nextPointIndex = Math.trunc(train.pos) + 1;
      if (isWormClosed(worm)) {
        nextPointIndex = nextPointIndex % path.length;
        if (nextPointIndex === 0)
          nextPointIndex++;
      }
      assert(currentPointIndex < path.length);
      if (!isWormClosed(worm) && nextPointIndex >= path.length) {
        crashTrain(train);
        setState(StateGameover);
        continue outer;
      }
      assert(nextPointIndex < path.length);
      const a = path[currentPointIndex];
      const b = path[nextPointIndex];
      d = dist(a, b);
      // FIXME: d == 0, we have a redundant point
      // It shouldn't happen, but we can fix it right there
      if (d > 0)
        break;
      path.splice(currentPointIndex, 1);
    }
    assert(d > 0);
    train.pos += train.speed / d;
    if (train.pos >= max_pos) {
      if (isWormClosed(worm)) {
        train.pos -= max_pos;
      }
      else {
        crashTrain(train)
        setState(StateGameover);
      }
    }
  }
}

function renderTrains(ctxt) {
  for (const train of g_game.trains) {
    if (train.hasCrashed)
      continue;

    ctxt.fillStyle = '#b00';

    const pos = getTrainScreenPos(train);
    drawPoint(ctxt, pos, 10, 'red', 'red')
  }
}

function assert(b) {
  if (!b)
    throw "Assert failed";
}

function computeDangerForWorm(worm) {
  let danger = 0;
  const middle = worm.points.length / 2;
  for (const train of getTrainsOnWorm(worm)) {
    const segIdx = Math.trunc(train.pos);
    const d = Math.abs(segIdx - middle) / middle;
    if (d > danger)
      danger = d;
  }
  return clamp(danger, 0, 1);
}

function getWormColors(danger) {
  if (danger < 0.5) {
    return g_colors['blue'];
  }
  else {
    return g_colors['pink'];
  }
}

function checkObstacles() {
  for (let w_i=0; w_i < g_game.worms.length; ++w_i) {
    const worm = g_game.worms[w_i];

    if ([...g_game.obstacles, ...g_game.loopNodes, ...g_game.doors].some(obj => obj.hits(worm)))
    {
      //setState(StateGameover);

      g_game.worms.splice(w_i, 1);
      --w_i;

      g_game.animations.push(new WormExplosion(worm.points, 'blue'));

      // BrrRrRRrrr
      g_game.screenshake.amplitude = 2;
      g_game.screenshake.speed = 2;
      g_game.screenshake.playFor(300);

      playAudio('fritz');
      showRetryButton(true);
    }
  }
}
