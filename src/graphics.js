const g_colors =
{
  // [primary color, glow color]
  blue: ['#cff7ff', '#29dcfd'],
  pink: ['#ffdeff', '#ff61fe'],
  orange: ['#ffe4d9', '#ff6121']
};

function drawShape(ctx, points, colorName)
{
  const color = g_colors[colorName];

  if (g_options.glowEnabled)
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

  ctx.fillStyle = color[0];
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; ++i)
    ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
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
