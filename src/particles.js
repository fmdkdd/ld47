'use strict';

class ParticleSystem
{
  constructor(particles)
  {
    this.particles = particles;
  }

  done()
  {
    return this.particles.length === 0;
  }

  update(dt)
  {
    // Delete outdated particles

    this.particles = this.particles.filter(p => p.age < p.lifetime);

    // Update

    const dts = dt / 1000;

    this.particles.forEach(p =>
    {
      p.age += dt;

      const lifeRatio = p.age / p.lifetime;

      p.pos[0] += p.vel[0] * dts;
      p.pos[1] += p.vel[1] * dts;

      p.vel[0] *= p.drag;
      p.vel[1] *= p.drag;

      p.scale = lerp(p.fromScale, p.toScale, lifeRatio);
    });
  }

  render(ctx)
  {
    this.particles.forEach(p =>
    {
      ctx.globalCompositeOperation = 'lighter';
      //ctx.filter = 'blur(3px)';
      ctx.fillStyle = '#ff3bfe';
      ctx.fillRect(p.pos[0], p.pos[1], 6 * p.scale, 6 * p.scale);
      //ctx.beginPath();
      //ctx.arc(p.pos[0], p.pos[1], 6 * p.scale, 0, Math.PI * 2);
      //ctx.fill();
//return;
      ctx.globalCompositeOperation = 'source-over';
      //ctx.filter = 'none';
      ctx.fillStyle = '#ffdeff';
      ctx.fillRect(p.pos[0], p.pos[1], 3 * p.scale, 6 * p.scale);
      //ctx.beginPath();
      //ctx.arc(p.pos[0], p.pos[1], 3 * p.scale, 0, Math.PI * 2);
      //ctx.fill();
    });
  }
}

class Particle
{
  constructor(pos, vel, {lifetime = 10, drag = 1, fromScale = 1, toScale = 1})
  {
    this.pos = pos;
    this.vel = vel;
    this.lifetime = lifetime;
    this.drag = drag;
    this.fromScale = fromScale;
    this.toScale = toScale;

    this.age = 0;
    this.scale = 1;
  }
}

function lerp(a, b, t)
{
  return a + (b - a) * t;
}

function makeExplosion(pos, particleCount)
{
  const particles = [];

  for (let i = 0; i < particleCount; ++i)
  {
    particles.push(new Particle(
      pos.slice(),
      vmult(randomDir(), 20),
      {
        lifetime: 5000,
        drag: 0.99,
        fromScale: 3,
        toScale: 1
      }
    ));
  }

  return new ParticleSystem(particles);
}
