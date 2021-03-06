class Door
{
  constructor(pos, openDistance, openSpeed, color)

  {
    this.pos = pos;
    this.openDistance = openDistance;
    this.openSpeed = openSpeed;
    this.color = color;

    this.currentState = OpenState;

    this.openRatio = 0; // [0, 1]
    this.age = 0;

    this.rot = 0;
    this.height = 100;
    this.powered = true;
    this.previousPowered = this.powered;
    this.anchorPos = vadd(this.pos, vmult(point(0, 1), openDistance * 1.55)); // HACK

    this.blinkingAnimation = null;
  }

  update(dt)
  {
    this.currentState.update(dt, this);

    // Start blinking
    if (this.powered && this.previousPowered !== this.powered)
    {
      this.blinkingAnimation = new BlinkingAnimation(1500, 400, 200);
    }

    if (this.blinkingAnimation)
    {
      if (this.blinkingAnimation.done())
        this.blinkingAnimation = null;
      else
        this.blinkingAnimation.update(dt);
    }

    this.previousPowered = this.powered;
  }

  render(ctx)
  {
    const points = this.getPoints();

    const on = this.blinkingAnimation ? this.blinkingAnimation.on : this.powered;
    drawShape(ctx, points[0], this.color, on);
    drawShape(ctx, points[1], this.color, on);
  }

  getPoints()
  {
    const origin = point(0, 0);

    const points =
    [
      [point(-10, 0), point(-10, this.height), point(10, this.height), point(10, 0)].map(p => rot(p, origin, this.rot)),
      [point(-10, 0), point(-10, -this.height), point(10, -this.height), point(10, 0)].map(p => rot(p, origin, this.rot))
    ];

    const dir = rot(point(0, this.openRatio * this.openDistance), origin, this.rot);
    points[0] = points[0].map(p => vadd(vadd(p, this.pos), dir));
    points[1] = points[1].map(p => vsub(vadd(p, this.pos), dir));

    return points;
  }

  hits(worm)
  {
    const check = pts =>
    {
      for (let i = 1; i < worm.points.length; ++i)
      {
        const wormA = worm.points[i - 1];
        const wormB = worm.points[i];

        for (let j = 1; j < pts.length; ++j)
        {
          const obsA = pts[j - 1];
          const obsB = pts[j];

          const hit = Intersects.lineLine(
            wormA[0], wormA[1], wormB[0], wormB[1],
            obsA[0], obsA[1], obsB[0], obsB[1]
          );

          if (hit)
            return true;
        }
      }

      return false;
    };

    const doorPoints = this.getPoints();
    return check(doorPoints[0]) || check(doorPoints[1]);
  }
}

const OpenState =
{
  update: function(dt, door)
  {
    if (!door.powered) return;

    door.age += dt;
    door.openRatio = 0.5 * Math.sin(door.age * door.openSpeed) + 0.5;
  }
};
