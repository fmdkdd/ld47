class ParticleSystem
{
  constructor(particles, {lifetime = 10, drag = 1, fromScale = 1, toScale = 1})
  {
    this.particles = particles;

    this.lifetime = lifetime;
    this.drag = drag;
    this.fromScale = fromScale;
    this.toScale = toScale;
  }

  update(dt)
  {
    // Delete outdated particles

    this.particles = this.particles.filter(p => p.age < this.lifetime);

    // Update

    const dts = dt / 1000;

    this.particles.forEach(p =>
    {
      p.age += dt;

      p.pos[0] += p.vel[0] * dts;
      p.pos[1] += p.vel[1] * dts;

      p.vel[0] *= this.drag;
      p.vel[1] *= this.drag;

      p.scale = 1; // TODO
    });
  }

  draw(ctx)
  {
    //ctx.globalCompositeOperation = 'lighter';
    //ctx.filter = 'blur(1px)';
    //ctx.strokeStyle = '#29dcfd';

    this.particles.forEach(p =>
    {
      //console.log(p.pos);
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(p.pos[0], p.pos[1], 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

class Particle
{
  constructor(pos, vel)
  {
    this.age = 0;
    this.pos = pos;
    this.vel = vel;
  }
}

function makeExplosion(pos, particleCount)
{
  const particles = [];

  for (let i = 0; i < particleCount; ++i)
  {
    particles.push(new Particle(pos.slice(), vmult(randomDir(), 10), {}));
  }

  return new ParticleSystem(
    particles,
    {
      lifetime: 5000,
      drag: 0.99,
      fromScale: 1,
      toScale: 3
    }
  );
}
