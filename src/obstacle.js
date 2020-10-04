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

/*const glow = 0.5 * Math.sin(g_lastFrameTime * g_options.glowSpeed) + 1;

      ctxt.globalCompositeOperation = 'lighter';
      ctxt.filter = 'blur(5px)';
      ctxt.strokeStyle = g_colors['blue'][1];
      ctxt.lineWidth = 10 * (1 - g_options.glowIntensity + g_options.glowIntensity * glow);
      ctxt.beginPath();
      ctxt.moveTo(worm.points[0][0], worm.points[0][1]);
      ctxt.curve(points, g_options.curveTension, g_options.curveSegments, false);
      ctxt.stroke();

      // Core layer

      ctxt.globalCompositeOperation = 'source-over';
      ctxt.filter = 'none';
      ctxt.strokeStyle = g_colors['blue'][0];
      ctxt.lineWidth = 4;
      ctxt.beginPath();
      ctxt.moveTo(worm.points[0][0], worm.points[0][1]);
      ctxt.curve(points, g_options.curveTension, g_options.curveSegments, false);
      ctxt.stroke();
*/
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
