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
