'use strict';

const DEBUG =
      ((location.hostname === 'localhost') ||
       (location.hostname === '127.0.0.1') ||
       (location.hostname === '0.0.0.0'));

const CANVAS_WIDTH  = 800;
const CANVAS_HEIGHT = 600;
const CANVAS_SCALE  = 1;

let g_options = {
  // Curve sampling
  samplingDistance   : 10,
  curveTension       : 0.5,
  curveSegments      : 10,
  // Controls
  connectionDistance : 10,
  grabDistance       : 30,
  splitDistance      : 10,
  trainSpeed         : 0.5,
  // Debug
  showWormPoints     : false,
  showWormLength     : false,
  // Rendering
  glowEnabled        : true,
  glowSpeed          : 0.0025,
  glowIntensity      : 0.3,
  gridSpacing        : 100,
};

let g_stats;

let g_canvas;
let g_ctxt;
let g_lastFrameTime = 0;
let g_updateClock = 0;

let g_CurrentState = null;

function setState(state) {
  if (g_CurrentState !== null && g_CurrentState.onExit)
    g_CurrentState.onExit(state);
  if (state.onEnter)
    state.onEnter(g_CurrentState);
  g_CurrentState = state;
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

function debugDrawPoint(a) {
  g_ctxt.fillStyle = '#ff0';
  g_ctxt.beginPath();
  g_ctxt.arc(a[0], a[1], 8, 0, 2*Math.PI);
  g_ctxt.fill();
}

function debugDrawLine(a, b) {
  g_ctxt.strokeStyle = '#ff0';
  g_ctxt.lineWidth = 4;
  g_ctxt.beginPath();
  g_ctxt.moveTo(a[0], a[1]);
  g_ctxt.lineTo(b[0], b[1]);
  g_ctxt.stroke();
}

function update(dt) {
  // Fixed timestep
  const timestep = 5;
  g_updateClock += dt;
  while (g_updateClock >= timestep) {
    g_updateClock -= timestep;
    g_CurrentState.update(timestep);
  }
}

function render(ctxt) {
  ctxt.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctxt.fillStyle = BACKGROUND_COLOR;
  ctxt.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctxt.save();
  g_CurrentState.render(ctxt);
  ctxt.restore();
}

function mainLoop(frameTime) {
  if (DEBUG)
    g_stats.begin();

  const dt = g_lastFrameTime > 0 ? frameTime - g_lastFrameTime : 5;
  g_lastFrameTime = frameTime;

  update(dt);
  render(g_ctxt);
  swap_input_states();

  if (DEBUG)
    g_stats.end();

  requestAnimationFrame(mainLoop);
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
  else if (event.button === 2) {
    console.log(g_mouse.x, g_mouse.y);
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

// TODO remove
function onMouseWheel(event) {

  //setState(StateLevelOver);

  if (event.deltaY > 0)
    g_currentLevel++;
  else
    g_currentLevel--;

  if (g_currentLevel < 0)
    g_currentLevel += g_levels.length;
  g_currentLevel = g_currentLevel % g_levels.length;
  loadLevel(g_currentLevel);
  setState(StateMain);

  event.preventDefault();
  return false;
}

function onContextMenu(event) {
  event.preventDefault();
  return false;
}

function onMouseLeave() {
  // Release left button
  g_mouse.buttons[0] = BUTTON_STATE_UP;
  return false;
}

let g_retryButton;

function showRetryButton(on)
{
  if (!on) {
    g_retryButton.classList.add('hidden');
  }
  else {
    g_retryButton.classList.remove('hidden');
  }
}

let g_logoImage;
let g_logoImage2;
let g_thanksImage;

window.addEventListener('DOMContentLoaded', function() {

  g_retryButton = document.querySelector('#retry');
  g_retryButton.addEventListener('click', e => {
      console.log('retry');
      loadLevel(g_currentLevel);
  });

  g_logoImage = document.querySelector('#logo');
  g_logoImage2 = document.querySelector('#logo2');
  g_thanksImage = document.querySelector('#thanks');

  g_canvas = document.querySelector('canvas');

  if (DEBUG) {
    g_stats = new Stats();
    g_stats.showPanel(0);
    document.body.appendChild(g_stats.dom);

    var gui = new dat.GUI();

    const curveOptions = gui.addFolder('Curve sampling');
    curveOptions.add(g_options, "samplingDistance", 0, 100);
    curveOptions.add(g_options, "curveTension", 0, 2);
    curveOptions.add(g_options, "curveSegments", 1, 30);

    const controlsOptions = gui.addFolder('Controls');
    controlsOptions.add(g_options, "connectionDistance", 0, 100);
    controlsOptions.add(g_options, "grabDistance", 0, 100);
    controlsOptions.add(g_options, "splitDistance", 0, 100);
    controlsOptions.add(g_options, "trainSpeed", 0.1, 1).onChange((v) => {
      for (let train of g_game.trains)
        train.speed = v;
    });

    const debugOptions = gui.addFolder('Debug');
    debugOptions.add(g_options, "showWormPoints");
    debugOptions.add(g_options, "showWormLength");

    const renderOptions = gui.addFolder('Rendering');
    renderOptions.add(g_options, "glowEnabled");
    renderOptions.add(g_options, "glowSpeed", 0, 0.01);
    renderOptions.add(g_options, "glowIntensity", 0, 1);
    renderOptions.add(g_options, "gridSpacing", 0, 300);

    g_canvas.addEventListener('mousewheel',  onMouseWheel);
  }

  g_canvas.addEventListener('mousemove',   onMouseMove);
  g_canvas.addEventListener('mousedown',   onMouseDown);
  g_canvas.addEventListener('mouseup',     onMouseUp);
  g_canvas.addEventListener('mouseleave',  onMouseLeave);
  g_canvas.addEventListener('contextmenu', onContextMenu);

  g_canvas.width = CANVAS_WIDTH;
  g_canvas.height= CANVAS_HEIGHT;
  g_canvas.style.width = (CANVAS_WIDTH * CANVAS_SCALE) + "px";
  g_canvas.style.height = (CANVAS_HEIGHT * CANVAS_SCALE) + "px";

  g_ctxt = g_canvas.getContext('2d');

  initAudio();

  gameInit();

  mainLoop();
});

let g_audio = {
  context: null,
  buffers: {},
  volumes: {},
  samplesWaitingToLoad: 0,
};

function initAudio() {
  g_audio.context = new AudioContext();

  loadAudioSample('bgm', 'assets/bgm.ogg', 0.6);
  loadAudioSample('neon-blink', 'assets/neon-blink.ogg');
  loadAudioSample('fritz', 'assets/fritz.ogg', 3);
  loadAudioSample('switch', 'assets/switch.ogg', 0.3);
  loadAudioSample('grab', 'assets/grab.ogg', 0.3);
  loadAudioSample('humm', 'assets/humm.ogg', 0.1);
}

function loadAudioSample(name, url, volume=1) {
  let request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";
  request.onload = function onload() {
    g_audio.context.decodeAudioData(this.response, function(decodedBuffer) {
      g_audio.buffers[name] = decodedBuffer;
      g_audio.volumes[name] = volume;
      g_audio.samplesWaitingToLoad--;
    });
  };
  g_audio.samplesWaitingToLoad++;
  request.send();
}

function playAudio(name, loop=false) {
  const source = g_audio.context.createBufferSource();
  if (g_audio.buffers[name] == null) {
    console.warn(`Audio buffer ${name} empty`);
    return;
  }
  source.buffer = g_audio.buffers[name];
  source.loop = loop;

  const volume = g_audio.volumes[name];
  if (volume != 1) {
    const gain = g_audio.context.createGain();
    gain.gain.value = volume || 1;
    source.connect(gain);
    gain.connect(g_audio.context.destination);
  } else {
    source.connect(g_audio.context.destination);
  }

  source.start(0);
  return source;
}
