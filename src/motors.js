class TranslationMotor
{
  constructor(moveVector, duration)
  {
    this.moveVector = moveVector;
    this.duration = duration;

    this.age = 0;
    this.currentOffset = [0, 0];
  }

  update(dt)
  {
    this.age += dt;

    const progress = (1 + Math.sin(this.age / this.duration * 2 * Math.PI)) / 2;
    this.currentOffset = vmult(this.moveVector, progress);
  }

  apply(points)
  {
    return points.map(p => vadd(p, this.currentOffset));
  }
}

class RotationMotor
{
  constructor(angle, pivot, duration)
  {
    this.angle = angle;
    this.pivot = pivot;
    this.duration = duration;

    this.age = 0;
    this.currentOffset = 0;
  }

  update(dt)
  {
    this.age += dt;

    const progress = (1 + Math.sin(this.age / this.duration * 2 * Math.PI)) / 2;
    this.currentOffset = this.angle * progress;
  }

  apply(points)
  {
    return points.map(p => rot(p, this.pivot, this.currentOffset));
  }
}
