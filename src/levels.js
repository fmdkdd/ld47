'use strict';

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Levels

let g_currentLevel = 4;

function loadLevel(n) {
  assert(g_levels[n] != null);

  resetGameState();

  g_game.grid = new Grid();

  g_levels[n]();

  setState(StateMain);
}

let g_levels = (function() {

  function RoundWorm(...args) {
    const w = createRoundWorm(...args);
    g_game.worms.push(w);
    return w;
  }

  function StraightWorm(...args) {
    const w = createStraightWorm(...args);
    g_game.worms.push(w);
    return w;
  }

  function Wall(coords, colorName) {
    const o = new Obstacles(points(...coords), colorName);
    g_game.obstacles.push(o);
    return o;
  }

  function GoalNode(x, y, radius, colorName) {
    const n = makeEndLevelNode(point(x, y), radius, colorName);
    g_game.loopNodes.push(n);
    return n;
  }

  function Train(wormId) {
    const t = createTrain(wormId);
    g_game.trains.push(t);
    return t;
  }

  function Dooro(x, y, openDistance, openSpeed, colorName) {
    const d = new Door(point(x, y), openDistance, openSpeed, colorName);
    g_game.doors.push(d);
    return d;
  }

  return [
    function level0() {
      StraightWorm(200, 300, 18, 'x');
      GoalNode(550, 300, 10, 'blue');

      Wall([-50, -50,
            1000, -50,
            1000,  50,
            -50,  20],
           'pink');

      Wall([-50,  -50,
            50,  -50,
            10, 1000,
            -50, 1000],
           'blue');

      Wall([-50, 1000,
            -50,  550,
            1000,  590,
            1000,  610],
           'pink');

      Wall([750, -50,
            850, -50,
            850, 610,
            780, 610],
           'blue');
    },

    function level1() {
      const w0 = RoundWorm(250, 300, 40, 20);
      GoalNode(550, 300, 10, 'blue');
      Train(w0.id);

      Wall([-50, -50,
            1000, -50,
            1000,  50,
            -50,  20],
           'pink');

      Wall([-50,  -50,
            50,  -50,
            10, 1000,
            -50, 1000],
           'blue');

      Wall([-50, 1000,
            -50,  550,
            1000,  590,
            1000,  610],
           'pink');

      Wall([750, -50,
            850, -50,
            850, 610,
            780, 610],
           'blue');
    },

    function level2() {
      const w0 = RoundWorm(120, 300, 30, 20);
      GoalNode(655, 295, 10, 'blue');
      Train(w0.id);

      Wall([
        81, 241,
        102, 227,
        173, 97,
        20, 89,
        30, 294
      ], 'orange');

      Wall([
        21, 287,
        88, 369,
        181, 361,
        206, 323,
        247, 332,
        261, 571,
        0, 560
      ], 'orange');

      Wall([
        156, 230,
        200, 141,
        277, 142,
        249, 313,
        207, 302,
        172, 242
      ], 'orange');

      Wall([
        329, 146,
        304, 324,
        379, 343,
        438, 315,
        415, 90,
        303, 86
      ], 'orange');

      Wall([
        302, 342,
        381, 360,
        442, 334,
        475, 509,
        317, 521
      ], 'orange');

      Wall([
        321, 571,
        547, 537,
        502, 290,
        555, 257,
        594, 289,
        608, 344,
        651, 356,
        694, 342,
        720, 293,
        681, 234,
        658, 93,
        795, 79,
        792, 589,
        305, 592
      ], 'orange');

      Wall([
        620, 138,
        635, 224,
        595, 275,
        556, 236,
        500, 274,
        475, 133
      ], 'orange');

      Wall([
        0, 0,
        800, 0,
        800, 100,
        0, 100
      ], 'orange');

      Wall([-50, -50,
            1000, -50,
            1000,  50,
            -50,  20],
           'pink');

      Wall([-50,  -50,
            50,  -50,
            10, 1000,
            -50, 1000],
           'blue');

      Wall([-50, 1000,
            -50,  550,
            1000,  590,
            1000,  610],
           'pink');

      Wall([750, -50,
            850, -50,
            850, 610,
            780, 610],
           'blue');
    },

    function level3() {
      const w0 = RoundWorm(120, 300, 20, 20);
      GoalNode(683, 293, 10, 'blue');
      Train(w0.id);

      for (let i=0; i < 20; ++i) {
        const d = Dooro(200 + i * 21, 300, 20, 0.001, 'pink');
        d.age = i * -100;
      }

      Wall([
        38, 274,
        118, 232,
        181, 258,
        624, 236,
        686, 193,
        785, 270,
        800, 0,
        0, 0
      ], 'orange');

      Wall([
        31, 300,
        119, 373,
        175, 351,
        619, 348,
        690, 380,
        775, 331,
        800, 600,
        0,  600
      ], 'orange');

      Wall([-50, -50,
            1000, -50,
            1000,  50,
            -50,  20],
           'pink');

      Wall([-50,  -50,
            50,  -50,
            10, 1000,
            -50, 1000],
           'blue');

      Wall([-50, 1000,
            -50,  550,
            1000,  590,
            1000,  610],
           'pink');

      Wall([750, -50,
            850, -50,
            850, 610,
            780, 610],
           'blue');
    },

    function level4() {
      StraightWorm(120, 100, 15, 'y');
      GoalNode(660, 483, 10, 'blue');

      Dooro(200, 280, 30, 0.002, 'pink');
      Dooro(300, 330, 30, 0.004, 'pink');
      Dooro(390, 260, 35, 0.006, 'pink');
      Dooro(460, 200, 10, 0.005, 'pink');

      Wall([
        23, 305,
        195, 372,
        301, 423,
        463, 291,
        561, 282,
        596, 373,
        302, 510,
        20, 400
      ], 'orange');

      Wall([
        166, 21,
        168, 180,
        300, 240,
        500, 106,
        534, 30
      ], 'orange');

      Wall([-50, -50,
            1000, -50,
            1000,  50,
            -50,  20],
           'pink');

      Wall([-50,  -50,
            50,  -50,
            10, 1000,
            -50, 1000],
           'blue');

      Wall([-50, 1000,
            -50,  550,
            1000,  590,
            1000,  610],
           'pink');

      Wall([750, -50,
            850, -50,
            850, 610,
            780, 610],
           'blue');
    }
  ];

}());
