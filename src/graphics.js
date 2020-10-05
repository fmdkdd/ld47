const g_colors =
{
  // [primary color, glow color, disabled color]
  blue: ['#cff7ff', '#29dcfd', '#3a5d63'],
  pink: ['#ffdeff', '#ff61fe', '#6E4B6E'],
  orange: ['#ffe4d9', '#ff6121', '#573d33'],
  yellow: ['#ffffb5', '#fdfc07', '#6e6e3c']
};

function drawShape(ctx, points, colorName, on = true)
{
  const color = g_colors[colorName];

  if (on && g_options.glowEnabled)
  {
    ctx.fillStyle = color[1];
    //ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(5px)';
    ctx.lineWidth = 10 * (1 - g_options.glowIntensity + g_options.glowIntensity * glow());

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; ++i)
      ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = on || color.length < 3 ? color[0] : color[2];
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; ++i)
    ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();

  /*if (!on)
  {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = color[1];
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }*/
}

function drawPath(ctx, points, strokeColor, glowColor)
{
  const curvePoints = points.flat();

  // Glow layer

  if (g_options.glowEnabled)
  {
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(5px)';
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 10 * (1 - g_options.glowIntensity + g_options.glowIntensity * glow());
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    ctx.curve(curvePoints, g_options.curveTension, g_options.curveSegments, false);
    ctx.stroke();
  }

  // Core layer

  ctx.globalCompositeOperation = 'source-over';
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
