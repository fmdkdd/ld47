class Obstacles
{
  constructor(points, color)
  {
    this.points = points;
    this.color = color;
  }

  update(dt)
  {
  }

  render(ctx)
  {
    drawShape(ctx, this.points, this.color);
  }

  hits(worm)
  {
    for (let i = 1; i < worm.points.length; ++i)
    {
      const wormA = worm.points[i - 1];
      const wormB = worm.points[i];

      for (let j = 1; j < this.points.length; ++j)
      {
        const obsA = this.points[j - 1];
        const obsB = this.points[j];

        const hit = Intersects.lineLine(
          wormA[0], wormA[1], wormB[0], wormB[1],
          obsA[0], obsA[1], obsB[0], obsB[1]
        );

        if (hit)
          return true;
    }}

    return false;
  }
}
