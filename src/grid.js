class Grid
{
  constructor()
  {
    this.age = 0;
  }

  update(dt)
  {
    this.age += dt;
  }

  render(ctx)
  {
    ctx.save()

    ctx.rotate(Math.sin(this.age* 0.0001) * 0.05);

    ctx.translate(Math.cos(this.age* 0.001) * 5, Math.sin(this.age* 0.0001) * 5);

    const scale = 1.1 + 0.05 * (1 + Math.cos(this.age* 0.0001)) / 2;
    ctx.scale(scale, scale);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#6f21ff';
    ctx.globalAlpha = 0.2;

    ctx.beginPath();

    for (let y = 0; y < g_canvas.height; y += g_options.gridSpacing)
    {
      ctx.moveTo(0, y);
      ctx.lineTo(g_canvas.width, y);
    }

    for (let x = 0; x < g_canvas.width; x += g_options.gridSpacing)
    {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, g_canvas.height);
    }

    ctx.stroke();

    ctx.restore();
  }
}