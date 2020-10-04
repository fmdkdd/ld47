class Door
{
  constructor(center, openDistance, openSpeed, color)

  {
    this.center = center;
    this.openDistance = openDistance;
    this.openSpeed = openSpeed;
    this.color = color;

    this.currentState = OpenState;

    this.openRatio = 0; // [0, 1]
    this.age = 0;
  }

  update(dt)
  {
    this.currentState.update(dt, this);
  }

  render(ctx)
  {
    const points = this.points()

    drawShape(ctx, points[0], 'pink');
    drawShape(ctx, points[1], 'pink');
  }

  points()
  {
    const points =
    [
      [point(-10, 0), point(-10, 100), point(10, 100), point(10, 0)],
      [point(-10, 0), point(-10, -100), point(10, -100), point(10, 0)]
    ];

    const dir = point(0, this.openRatio * this.openDistance);
    points[0] = points[0].map(p => vadd(vadd(p, this.center), dir));
    points[1] = points[1].map(p => vsub(vadd(p, this.center), dir));

    return points;
  }
}

const OpenState =
{
  update: function(dt, door)
  {
    door.age += dt;
    door.openRatio = 0.5 * Math.sin(door.age * door.openSpeed) + 0.5;
  }
};

function drawShape(ctx, points, colorName)
{
  const color = g_colors[colorName];

  //

  ctx.fillStyle = color[1];
  //ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(5px)';

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; ++i)
    ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();

  //

  ctx.fillStyle = color[0];
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; ++i)
    ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}
