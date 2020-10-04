class WormExplosion
{
  constructor(worm, colorName)
  {
    this.colorName = colorName;

    // Worm points -> segment list

    this.segments = [];
    this.directions = [];
    this.angularSpeeds = [];

    for (let i = 1; i < worm.points.length; ++i)
    {
      this.segments.push([worm.points[i - 1], worm.points[i]]);
      this.angularSpeeds.push(2 * Math.random() - 1);
      this.directions.push(randomDir());
    }

    this.age = 0;
    this.duration = 2500;
  }

  done()
  {
    return this.age > this.duration;
  }

  update(dt)
  {
    this.age += dt;

    for (let i = 0; i < this.segments.length; ++i)
    {
      const seg = this.segments[i];

      let middle = vmult(vadd(seg[0], seg[1]), 0.5);

      // Move away

      const dir = this.directions[i];
      middle = vadd(middle, vmult(dir, 5 * dt));

      // Rotate

      const angle = this.angularSpeeds[i] * 0.001 * dt;
      const cosa = Math.cos(angle);
      const sina = Math.sin(angle);

      const rot = (p) =>
      {
        return [
          cosa * (p[0] - middle[0]) - sina * (p[1] - middle[1]) + middle[0],
          sina * (p[0] - middle[0]) + cosa * (p[1] - middle[1]) + middle[1]
        ];
      };

      seg[0] = rot(seg[0]);
      seg[1] = rot(seg[1]);
    }
  }

  render(ctx)
  {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';

    const ageRatio = Math.min(1, Math.max(0, this.age / this.duration));
    ctx.globalAlpha = lerp(1, 0, ageRatio);

    ctx.beginPath();

    const color = g_colors[this.colorName];

    for (let i = 0; i < this.segments.length; ++i)
    {
      const seg = this.segments[i];

      drawPath(ctx, seg, color[0], color[1]);
      //ctx.moveTo(...seg[0]);
      //ctx.lineTo(...seg[1]);
    }

    ctx.stroke();

    ctx.globalAlpha = 1;
  }
}
