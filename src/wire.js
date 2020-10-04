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
    /*const path =
    [
      this.from.anchorPos,
      point(this.from.anchorPos[0], this.to.anchorPos[1]),
      this.to.anchorPos
    ];

    //drawPath(ctx, path, 'pink');

    ctx.save();

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.from.enabled ? 'white' : 'grey';
    ctx.setLineDash([5, 20]);

    ctx.beginPath();
    ctx.moveTo(...path[0]);
    ctx.lineTo(...path[1]);
    ctx.lineTo(...path[2]);
    ctx.stroke();

    ctx.restore();*/
  }
}
