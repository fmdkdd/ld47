class ScreenShake
{
  constructor()
  {
    this.amplitude = 3;
    this.speed = 0.02;

    this.remainingTime = 0;
    this.x = 0;
    this.y = 0;
    this.age = 0;
  }

  playFor(ms)
  {
    this.remainingTime = ms;
  }

  update(dt)
  {
    this.age += dt;

    this.remainingTime -= dt;

    if (this.remainingTime > 0)
    {
      this.x = Math.sin(this.age * this.speed) * this.amplitude;
      this.y = Math.cos(this.age * this.speed) * this.amplitude * this.x;
    }
    else
    {
      this.x = this.y = 0;
    }
  }

  render(ctx)
  {
    ctx.translate(this.x, this.y);
  }
}
