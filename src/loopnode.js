'use strict';

class LoopNode
{
  constructor(pos, color)
  {
    this.pos = pos;
    this.color = color;
  }

  update(dt)
  {
  }

  render(ctx)
  {
    // TODO draw func?

    const color = g_colors[this.color];

    if (g_options.glowEanbled)
    {
      ctx.fillStyle = color[1];
      //ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(5px)';

      ctx.beginPath();
      ctx.arc(this.pos[0], this.pos[1], 10, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = color[0];
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';

    ctx.beginPath();
    ctx.arc(this.pos[0], this.pos[1], 10, 0, 2 * Math.PI);
    ctx.fill();
  }

  isSurrounded(worm)
  {
    if (!isWormClosed(worm))
      return;

    // Cast an horizontal ray from the node's position.
    // Odd number of intersections = the node is surrounded

    let ray = [this.pos[0], this.pos[1], this.pos[0] + 10000, this.pos[1]];

    let hits = 0;

    for (let i = 1; i < worm.points.length; ++i)
    {
      const a = worm.points[i - 1];
      const b = worm.points[i];

      const hit = Intersects.lineLine(
        ray[0], ray[1], ray[2], ray[3],
        a[0], a[1], b[0], b[1]
      );

      if (hit)
        ++hits;
    }

    return (hits & 1) == 1;
  }
}
