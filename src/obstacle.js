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
    const color = g_colors[this.color];

    ctx.fillStyle = color[1];
    //ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(5px)';

    ctx.beginPath();
    ctx.moveTo(this.points[0][0], this.points[0][1]);
    for (let i = 1; i < this.points.length; ++i)
      ctx.lineTo(this.points[i][0], this.points[i][1]);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color[0];
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';

    ctx.beginPath();
    ctx.moveTo(this.points[0][0], this.points[0][1]);
    for (let i = 1; i < this.points.length; ++i)
      ctx.lineTo(this.points[i][0], this.points[i][1]);
    ctx.closePath();
    ctx.fill();
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
