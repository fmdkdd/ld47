'use strict';

function point(x, y) {
  return [x, y];
}

function dist(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx*dx + dy*dy);
}

function dot_product(u, v) {
  return u[0] * v[0] + u[1] * v[1];
}

function vec(a, b) {
  return [b[0] - a[0], b[1] - a[1]];
}

function vlength(v) {
  return dist([0,0], v);
}

function vnorm(v) {
  const l = vlength(v);
  return [v[0] / l, v[1] / l];
}

function vadd(u, v) {
  return [u[0] + v[0], u[1] + v[1]];
}

function vmult(v, s) {
  return [v[0] * s, v[1] * s];
}

function randomDir() {
  return vnorm(point(Math.random() - 0.5, Math.random() - 0.5));
}

function lerp(a, b, dt) {
  return a*dt + (1-dt) * b;
}

function clamp(x, a, b) {
  if (x < a) return a;
  if (x > b) return b;
  return x;
}

// Return a vector W, result of U projected on V and clamped to V
function project_clamped(u, v) {
  const axis = vnorm(v);
  const dot = dot_product(axis, u);
  return vmult(axis, clamp(dot, 0, vlength(v)));
}
