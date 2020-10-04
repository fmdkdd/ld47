class Wire
{
  constructor(from, to)
  {
    this.from = from;
    this.to = to;
  }

  update(dt)
  {
    // Sync the two objects
    this.to.powered = this.from.enabled;
  }

  render(ctx)
  {
    const path =
    [
      this.from.pos,
      point(this.from.pos[0], this.to.pos[1]),
      this.to.pos
    ];

    //drawPath(ctx, path, 'pink');

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.from.enabled ? 'white' : 'grey';

    ctx.beginPath();
    ctx.moveTo(...path[0]);
    ctx.lineTo(...path[1]);
    ctx.lineTo(...path[2]);
    ctx.stroke();
  }
}
