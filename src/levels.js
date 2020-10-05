'use strict';

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Levels

let g_currentLevel = 4;

function loadLevel(n) {
  assert(g_levels[n] != null);

  resetGameState();

  g_game.grid = new Grid();
  g_game.screenshake = new ScreenShake();

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

  function Train(worm, speed=g_options.trainSpeed) {
    const t = createTrain(worm.id);
    t.speed = speed;
    g_game.trains.push(t);
    return t;
  }

  function Dooro(x, y, openDistance, openSpeed, colorName, rot=0, height=100) {
    const d = new Door(point(x, y), openDistance, openSpeed, colorName);
    d.rot = rot;
    d.height = height;
    g_game.doors.push(d);
    return d;
  }

  function Switch(x, y, radius, colorName) {
    const n = new LoopNode(point(x, y), radius, colorName);
    g_game.loopNodes.push(n);
    return n;
  }

  function Wiro(node, door) {
    const w = new Wire(node, door);
    g_game.wires.push(w);
    return w;
  }

  return [
    function level0() {
      StraightWorm(200, 300, 18, 'x');
      const g = GoalNode(550, 300, 10, 'blue');
      g.hintRadius = 22;

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

    function level01() {
      RoundWorm(140, 80, 25, 20);
      const g = GoalNode(710, 512, 10, 'blue');
      g.hintRadius = 20;

      Wall([
        231, 27,
        243, 71,
        605, 84,
        784, 4
      ], 'pink');

      Wall([
        36, 106,
        150, 135,
        246, 116,
        600, 129,
        401, 194,
        6, 204
      ], 'blue');

      Wall([
        243, 319,
        260, 503,
        286, 501,
        362, 397,
        464, 504,
        518, 384,
        584, 500,
        674, 433,
        735, 216
      ], 'orange');

      Wall([
        771, 141,
        646, 140,
        421, 228,
        114, 239,
        181, 421,
        246, 423,
        423, 342,
        784, 320
      ], 'blue');

      Wall([
        30, 242,
        87, 247,
        154, 423,
        0, 450
      ], 'blue');

      Wall([
        269, 573,
        266, 524,
        290, 518,
        366, 425,
        468, 535,
        521, 412,
        583, 529,
        686, 584
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

    function level1() {
      Train(RoundWorm(250, 300, 40, 20), 0.2);
      const g = GoalNode(550, 300, 20, 'blue');
      g.hintRadius = 20;

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
      const g = GoalNode(655, 295, 10, 'blue');
      g.hintRadius = 20;
      Train(w0);

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

    function level3a() {
      Train(RoundWorm(117, 479, 30, 20));
      const g = GoalNode(650, 120, 10, 'blue');
      g.hintRadius = 20;

      Dooro(118, 366, 50, 0.002, 'blue', 1.8);
      {
        const d = Dooro(254, 294, 50, 0.002, 'blue', 0.1);
        d.age = 1000;
      }
      {
        const d = Dooro(377, 399, 50, 0.002, 'blue', 1.4);
        d.age = 500;
      }
      {
        const d = Dooro(670, 398, 50, 0.002, 'blue', 1.7);
        d.age = 1000;
      }

      {
        const d = Dooro(140, 149, 50, 0.0025, 'orange', 1.6);
        d.age = 1000;
      }
      {
        const d = Dooro(130, 181, 60, 0.0025, 'orange', 1.6);
        d.age = 1000;
      }

      Dooro(365, 82, 30, 0.002, 'orange', -0.05);
      {
        const d = Dooro(365, 82, 30, 0.001, 'orange', -0.05);
        d.age = 1000;
      }

      Wall([
        180, 204,
        171, 131,
        499, 131,
        576, 286,
        557, 525,
        494, 521,
        438, 232
      ], 'orange');

      Wall([
        214, 359,
        283, 364,
        310, 579,
        183, 574
      ], 'pink');

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
      Train(RoundWorm(120, 300, 20, 20));
      const g = GoalNode(683, 293, 10, 'blue');
      g.hintRadius = 20;

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
      const g = GoalNode(660, 483, 10, 'blue');
      g.hintRadius = 20;

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
    },

    function level5() {
      RoundWorm(120, 100, 25, 20);

      {
        const s = Switch(158, 223, 8, 'orange');
        const d = Dooro(300, 280, 40, 0.004, 'orange', -12, 1000);
        d.age = 1200;
        Wiro(s, d);
      }

      {
        const s = Switch(442, 460, 8, 'pink');
        const d = Dooro(600, 380, 15, 0.008, 'pink', 2.3, 1000);
        d.age = 1400;
        Wiro(s, d);
      }

      const g = GoalNode(600, 160, 10, 'blue');
      g.hintRadius = 20;

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

    function level6() {
      RoundWorm(187, 114, 25, 20);
      RoundWorm(625, 424, 25, 20);
      RoundWorm(169, 414, 25, 20);

      GoalNode(387, 276, 50, 'blue');


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

    function level7() {
      Train(RoundWorm(187, 114, 25, 20), 0.4);
      Train(RoundWorm(718, 502, 25, 20), 0.4);

      {
        const s = Switch(518, 358, 8, 'orange');
        const d = Dooro(195, 306, 40, 0.004, 'orange', 1.5, 180);
        d.age = 1200;
        Wiro(s, d);
      }

      {
        const s = Switch(199, 433, 8, 'pink');
        const d = Dooro(585, 273, 15, 0.008, 'pink', 1.66, 200);
        d.age = 1400;
        Wiro(s, d);
      }

      GoalNode(600, 160, 10, 'blue');

      Wall([
        766, 169,
        649, 280,
        627, 371,
        662, 427,
        773, 410
      ], 'blue');

      Wall([
        788, 468,
        750, 588,
        632, 548,
        635, 467,
        512, 446,
        413, 384,
        426, 489,
        419, 566,
        789, 592
      ], 'pink');

      Wall([
        309, 19,
        370, 582,
        434, 583,
        407, 19
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

    function level8() {
      Train(RoundWorm(121, 98, 30, 20), 0.4);
      Train(RoundWorm(718, 502, 30, 20), 0.4);

      Dooro(244, 109, 80, 0.0005, 'orange', 0.8, 120);
      Dooro(104, 245, 80, 0.0007, 'orange', 0.8, 120);

      Dooro(711, 379, 30, 0.001, 'blue', 1.6, 120);
      Dooro(550, 517, 20, 0.001, 'blue', 0.3, 120);

      GoalNode(389, 283, 30, 'blue');

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
