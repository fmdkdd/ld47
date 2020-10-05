'use strict';

class LoopNode
{
  constructor(pos, radius, color, drawHint, onSurrounded)
  {
    this.pos = pos;
    this.radius = radius;
    this.color = color;
    this.drawHint = drawHint;
    this.hintRadius = 50;
    this.onSurrounded = onSurrounded;

    this.enabled = false;
    this.anchorPos = this.pos;
    this.age = 0;
    this.drawSquare = true; // Otherwise circle

    this.animation = null;
  }

  update(dt)
  {
    this.age += dt;

    this.enabled = false;

    for (let w_i=0, w_len=g_game.worms.length; w_i < w_len; ++w_i)
    {
      if (this.isSurrounded(g_game.worms[w_i]))
      {
        // Execute the callback
        if (this.onSurrounded && !this.enabled)
        {
          this.onSurrounded();
        }

        this.enabled = true;
        break;
      }
    }

    if (this.animation)
    {
      this.animation.update(dt);
    }
  }

  hits(worm)
  {
    for (let i = 1; i < worm.points.length; ++i)
    {
      const wormA = worm.points[i - 1];
      const wormB = worm.points[i];

      const hit = Intersects.circleLine(
        this.pos[0], this.pos[1], this.radius,
        wormA[0], wormA[1], wormB[0], wormB[1]
      );

      if (hit)
        return true;
    }

    return false;
  }

  render(ctx)
  {
    const color = g_colors[this.color];

    ctx.save();

    if (this.animation)
    {
      this.animation.render(ctx, this.pos);
    }

    ctx.globalCompositeOperation = 'lighter';

    if (this.enabled && g_options.glowEnabled)
    {
      ctx.shadowColor = color[1];
      ctx.shadowBlur = 10 * (1 - g_options.glowIntensity + g_options.glowIntensity * glow());
    }

    ctx.fillStyle = this.enabled || color.length < 3 ? color[0] : color[2];
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';

    ctx.beginPath();
    if (this.drawSquare)
    {
      ctx.moveTo(...vadd(this.pos, point(0, -10)));
      ctx.lineTo(...vadd(this.pos, point(10, 0)));
      ctx.lineTo(...vadd(this.pos, point(0, 10)));
      ctx.lineTo(...vadd(this.pos, point(-10, 0)));
    }
    else
    {
      ctx.arc(this.pos[0], this.pos[1], this.radius, 0, 2 * Math.PI);
    }

    ctx.fill();

    if (this.drawHint)
    {
      const dur = 5000;
      const dur2 = dur / 2;
      const radius = this.radius + this.hintRadius;

      const progress = (this.age % dur) / dur;

      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#DCDCDC';
      ctx.setLineDash([3, 10]);
      ctx.beginPath();

      if (progress < 0.5)
      {
        const angle = lerp(0, 2 * Math.PI, progress / 0.5);
        ctx.arc(this.pos[0], this.pos[1], radius, -Math.PI * 0.5, -Math.PI * 0.5 + angle, false);
      }
      else
      {
        const angle = lerp(0, 2 * Math.PI, (progress - 0.5) / 0.5);
        ctx.arc(this.pos[0], this.pos[1], radius, -Math.PI * 0.5, -Math.PI * 0.5 + angle, true);
      }

      ctx.stroke();
    }

    ctx.restore();
  }

  isSurrounded(worm)
  {
    if (!isWormClosed(worm))
      return false;

    // Cast an horizontal ray from the node's position.
    // Odd number of intersections = the node is surrounded

    /*let ray = [this.pos[0], this.pos[1], this.pos[0] + 10000, this.pos[1]];

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

    // Debug
    if ((hits & 1) == 1)
      console.log(hits);

    return (hits & 1) == 1;*/

    return pointInPolygon(this.pos, [worm.points]);
  }
}

function makeEndLevelNode(pos, radius, color)
{
  const node = new LoopNode(pos, radius, color, true, () => setState(StateLevelOver));
  node.enabled = true;
  node.drawSquare = false;
  node.animation = new WaveAnimation(50, 3000, 5000);
  return node;
}
