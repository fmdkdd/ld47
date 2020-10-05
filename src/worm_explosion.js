class WormExplosion
{
  constructor(points, colorName)
  {
    this.colorName = colorName;

    // points -> segment list

    this.segments = [];
    this.directions = [];
    this.angularSpeeds = [];
    this.speeds = [];

    this.maxLength = 50;

    for (let i = 1; i < points.length; ++i)
    {
      const segment = [points[i - 1], points[i]];

      const segments = [];

      const length = vlength(vsub(points[i - 1], points[i]));

      if (length > this.maxLength)
      {
        const parts = Math.ceil(length / this.maxLength);
        const step = vmult(vnorm(vsub(segment[1], segment[0])), this.maxLength);

        for (let p = 0; p < parts; ++p)
        {
          segments.push([
            vadd(segment[0], vmult(step, p)),
            vadd(segment[0], vmult(step, p + 1))
          ]);
        }
      }
      else
      {
        segments.push(segment);
      }

      for (let s of segments)
      {
        this.segments.push(s);
        this.angularSpeeds.push(2 * Math.random() - 1);
        this.speeds.push(20 * Math.random());
        this.directions.push(randomDir());
      }
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
      middle = vadd(middle, vmult(dir, this.speeds[i] * dt));

      // Rotate

      const angle = this.angularSpeeds[i] * 0.001 * dt;

      seg[0] = rot(seg[0], middle, angle);
      seg[1] = rot(seg[1], middle, angle);
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
