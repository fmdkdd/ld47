class Obstacles
{
  constructor(points, color)
  {
    this.points = points;
    this.color = color;

    this.motor = null;

    this.on = true;
    this.blinkingAnimation = null;
  }

  update(dt)
  {
    if (this.motor)
    {
      this.motor.update(dt);
    }

    if (this.blinkingAnimation)
    {
      if (this.blinkingAnimation.done())
        this.blinkingAnimation = null;
      else
        this.blinkingAnimation.update(dt);
    }
  }

  render(ctx)
  {
    const on = this.blinkingAnimation ? this.blinkingAnimation.on : this.on;
    drawShape(ctx, this.getPoints(), this.color, on);
  }

  hits(worm)
  {
    const transformedPoints = this.getPoints();

    for (let i = 1; i < worm.points.length; ++i)
    {
      const wormA = worm.points[i - 1];
      const wormB = worm.points[i];

      for (let j = 0; j < transformedPoints.length; ++j)
      {
        const obsA = transformedPoints[j];
        const obsB = transformedPoints[(j + 1) % transformedPoints.length];

        const hit = Intersects.lineLine(
          wormA[0], wormA[1], wormB[0], wormB[1],
          obsA[0], obsA[1], obsB[0], obsB[1]
        );

        if (hit)
          return true;
    }}

    return false;
  }

  getPoints()
  {
    if (!this.motor)
      return this.points;

    return this.motor.apply(this.points);
  }
}
