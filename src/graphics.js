const BACKGROUND_COLOR = '#1A1A1A';

const g_colors =
{
  // [primary color, glow color, disabled color]
  blue: ['#cff7ff', '#29dcfd', '#3a5d63'],
  pink: ['#ffdeff', '#ff61fe', '#6E4B6E'],
  orange: ['#ffe4d9', '#ff6121', '#573d33'],
  yellow: ['#ffffb5', '#fdfc07', '#6e6e3c'],
  green: ['#baffd8', '#21ff85', '#496e59'],
  white: ['white', 'white', 'grey'],
  red: ['#ff8787', '#ff3b3b', '#6e4040'],
};

function drawShape(ctx, points, colorName, on = true)
{
  const color = g_colors[colorName];

  ctx.save();

  if (on && g_options.glowEnabled)
  {
    ctx.shadowColor = color[1];
    ctx.shadowBlur = 10 * (1 - g_options.glowIntensity + g_options.glowIntensity * glow());
  }
  else
  {
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 10;
  }

  ctx.fillStyle = on ? color[0] : color[2];

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; ++i)
    ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPath(ctx, points, strokeColor, glowColor)
{
  const curvePoints = points.flat();

  ctx.save();

  // Glow layer

  ctx.globalCompositeOperation = 'lighter';

  if (g_options.glowEnabled)
  {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10 * (1 - g_options.glowIntensity + g_options.glowIntensity * glow());
  }

  // Core layer

  ctx.filter = 'none';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.curve(curvePoints, g_options.curveTension, g_options.curveSegments, false);
  ctx.stroke();

  /*
  if (drawHead)
  {
    const tip = points[points.length - 1];

    const dir = vnorm(vsub(points[points.length - 2], tip));
    const side1 = vadd(points[points.length - 2], vmult(vortho(dir), g_options.tipWidth));
    const side2 = vsub(points[points.length - 2], vmult(vortho(dir), g_options.tipWidth));

    ctx.beginPath();
    ctx.moveTo(...side1);
    ctx.lineTo(...tip);
    ctx.lineTo(...side2);
    ctx.fill()
  }
  */

  ctx.restore();
}

function drawPoint(ctx, pos, radius, strokeColor, glowColor, fill = true)
{
  ctx.save();

  // Glow layer

  ctx.globalCompositeOperation = 'lighter';

  if (g_options.glowEnabled)
  {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10 * (1 - g_options.glowIntensity + g_options.glowIntensity * glow());
  }

  // Core layer

  ctx.fillStyle = strokeColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos[0], pos[1], radius, 0, 2 * Math.PI);
  ctx.stroke();
  if (fill) ctx.fill();

  ctx.restore();
}

function glow()
{
  return 0.5 * Math.sin(g_lastFrameTime * g_options.glowSpeed) + 0.5;
}

class BlinkingAnimation
{
  constructor(duration, offMaxDuration, onMaxDuration)
  {
    this.duration = duration;
    this.offMaxDuration = offMaxDuration;
    this.onMaxDuration = onMaxDuration;

    this.age = 0;
    this.stepAge = 0;

    this.on = Math.random() > 0.5;
    this.next();
  }

  done()
  {
    return this.age > this.duration;
  }

  update(dt)
  {
    this.age += dt;
    this.stepAge += dt;

    if (this.stepAge > this.nextToggle)
    {
      this.on = !this.on;
      this.next();
    }
  }

  next()
  {
    this.stepAge = 0;
    this.nextToggle = Math.random() * (this.on ? this.offMaxDuration : this.onMaxDuration);
  }
}

class WaveAnimation
{
  constructor(radius, travelDuration, pauseDuration)
  {
    this.radius = radius;
    this.travelDuration = travelDuration;
    this.pauseDuration = pauseDuration;

    this.age = 0;
    this.travel = true;
  }

  done()
  {
    return false;
  }

  update(dt)
  {
    this.age += dt;

    if (this.travel)
    {
      if (this.age > this.travelDuration)
      {
        this.travel = false;
      }
    }
    else
    {
      if (this.age > this.travelDuration + this.pauseDuration)
      {
        this.travel = true;
        this.age = 0;
      }
    }
  }

  render(ctx, pos)
  {
    ctx.save();

    if (!this.travel)
      return;

    const progress = this.age / this.travelDuration
    const radius = this.radius * progress;

    ctx.globalAlpha = 1 - progress;

    const gradient = ctx.createRadialGradient(pos[0], pos[1], 0, pos[0], pos[1], radius);
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.95, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }
}

class Img
{
  constructor(pos, size,image)
  {
    this.pos = pos;
    this.size = size;
    this.image = image;

    this.motor = null;
  }

  update(dt)
  {
    if (this.motor)
    {
      this.motor.update(dt);
    }
  }

  getPos()
  {
    if (!this.motor)
      return this.pos;

    return this.motor.apply([this.pos])[0];
  }

  render(ctx)
  {
    const p = this.getPos();

    ctx.shadowBlur = 10;
    ctx.shadowColor = 'white'
    ctx.drawImage(this.image, p[0], p[1], this.size[0], this.size[1]);
  }
}
