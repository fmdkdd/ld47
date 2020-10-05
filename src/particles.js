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

      if (g_options.glowEnabled)
      {
        ctx.shadowColor = color[1];
        ctx.shadowBlur = 10;
      }

      ctx.globalAlpha = 1 - p.age / p.lifetime;
      ctx.fillStyle = color[1];
      ctx.beginPath();
      ctx.arc(p.pos[0], p.pos[1], p.scale, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
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
      vmult(randomDir(), 200 + Math.random() * 50),
      {
        lifetime: 1000,
        drag: 0.99,
        fromScale: 5,
        toScale: 2,
        color: 'red'
      }
    ));
  }

  return new ParticleSystem(particles);
}
