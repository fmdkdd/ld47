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
      const color = g_colors[p.color];

      //ctx.globalCompositeOperation = 'lighter';
      //ctx.fillStyle = '#ff3bfe';
      //ctx.fillRect(p.pos[0], p.pos[1], 6 * p.scale, 6 * p.scale);

      //ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color[1];
      ctx.fillRect(p.pos[0], p.pos[1], 1 * p.scale, 1 * p.scale);
    });
  }
}

class Particle
{
  constructor(pos, vel, {lifetime = 10, drag = 1, fromScale = 1, toScale = 1, color = 'white'})
  {
    this.pos = pos;
    this.vel = vel;
    this.lifetime = lifetime;
    this.drag = drag;
    this.fromScale = fromScale;
    this.toScale = toScale;
    this.color = color;

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
      vmult(randomDir(), 20 + Math.random() * 10),
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

function makeTrainExplosion(pos, particleCount)
{
  const particles = [];

  for (let i = 0; i < particleCount; ++i)
  {
    particles.push(new Particle(
      pos.slice(),
      vmult(randomDir(), 20 + Math.random() * 10),
      {
        lifetime: 3000,
        drag: 0.99,
        fromScale: 10,
        toScale: 2,
        color: 'red'
      }
    ));
  }

  return new ParticleSystem(particles);
}
