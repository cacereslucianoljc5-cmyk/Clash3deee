// WGSL shaders for the Siege GPU game.
//
// Two modules:
//  - COMPUTE: `initMain` seeds the particle field, `simMain` advances it every
//    frame (movement, life, blast collisions, castle breaches).
//  - RENDER:  instanced billboard quads, one per particle, drawn as glowing
//    additive blobs colored by remaining life.
//
// The struct layouts below MUST stay in sync with the TypeGPU `d.struct`
// definitions in renderer.js (std430 for storage, std140 for the uniform).

export const MAX_BLASTS = 24;

const SHARED_STRUCTS = /* wgsl */ `
struct Particle {
  pos     : vec2f,
  vel     : vec2f,
  life    : f32,
  maxLife : f32,
};

struct Params {
  aspect       : f32,
  dt           : f32,
  time         : f32,
  speed        : f32,
  castleRadius : f32,
  count        : u32,
  blastCount   : u32,
  seed         : f32,
};

struct Blast {
  pos      : vec2f,
  radius   : f32,
  strength : f32,
};
`;

export const COMPUTE_WGSL = /* wgsl */ `
${SHARED_STRUCTS}

struct Stats {
  score    : atomic<u32>,
  breaches : atomic<u32>,
};

@group(0) @binding(0) var<storage, read_write> parts  : array<Particle>;
@group(0) @binding(1) var<uniform>             params : Params;
@group(0) @binding(2) var<storage, read>       blasts : array<Blast>;
@group(0) @binding(3) var<storage, read_write> stats  : Stats;

fn rnd(seed: f32) -> f32 {
  return fract(sin(seed * 12.9898) * 43758.5453);
}

// Spawn particle i somewhere on the outer ring, heading for the castle (origin).
fn spawn(i: u32, salt: f32) {
  let fi   = f32(i);
  let a    = rnd(fi * 0.137 + params.seed + salt) * 6.2831853;
  let ring = 1.28 + rnd(fi * 0.713 + params.seed * 1.7 + salt) * 0.45;
  let pos  = vec2f(cos(a) * ring, sin(a) * ring);
  let dir  = normalize(vec2f(0.0, 0.0) - pos);
  let spd  = params.speed * (0.55 + rnd(fi * 1.31 + params.seed) * 0.9);
  let life = 6.0 + rnd(fi * 3.37 + params.seed) * 7.0;

  parts[i].pos     = pos;
  parts[i].vel     = dir * spd;
  parts[i].life    = life;
  parts[i].maxLife = life;
}

@compute @workgroup_size(64)
fn initMain(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.count) { return; }
  spawn(i, 0.0);
  // Stagger initial lifetimes so the first wave doesn't arrive as one wall.
  parts[i].life = parts[i].maxLife * (0.15 + rnd(f32(i) * 5.11 + 1.0) * 0.85);
}

@compute @workgroup_size(64)
fn simMain(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.count) { return; }

  var p = parts[i];

  if (p.life <= 0.0) {
    spawn(i, params.time);
    return;
  }

  p.pos  = p.pos + p.vel * params.dt;
  p.life = p.life - params.dt;

  // Blast collisions -> destroyed, score up.
  var killed = false;
  for (var b: u32 = 0u; b < params.blastCount; b = b + 1u) {
    let bl = blasts[b];
    if (distance(p.pos, bl.pos) < bl.radius) {
      killed = true;
      break;
    }
  }
  if (killed) {
    p.life = 0.0;
    atomicAdd(&stats.score, 1u);
  } else if (length(p.pos) < params.castleRadius) {
    // Reached the castle -> breach.
    p.life = 0.0;
    atomicAdd(&stats.breaches, 1u);
  }

  parts[i] = p;
}
`;

export const RENDER_WGSL = /* wgsl */ `
${SHARED_STRUCTS}

@group(0) @binding(0) var<storage, read> parts  : array<Particle>;
@group(0) @binding(1) var<uniform>       params : Params;

struct VSOut {
  @builtin(position) clip  : vec4f,
  @location(0)       color : vec3f,
  @location(1)       uv    : vec2f,
};

@vertex
fn vs(@builtin(vertex_index) vi: u32,
      @builtin(instance_index) ii: u32) -> VSOut {
  var offs = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0,  1.0), vec2f(1.0, -1.0), vec2f( 1.0, 1.0),
  );

  let p     = parts[ii];
  let alive = p.life > 0.0;
  let ratio = clamp(p.life / max(p.maxLife, 0.0001), 0.0, 1.0);
  let size  = select(0.0, 0.014, alive);

  let o     = offs[vi];
  let world = p.pos + o * size;
  let clip  = vec2f(world.x / params.aspect, world.y);

  var out: VSOut;
  out.clip  = vec4f(clip, 0.0, 1.0);
  // Fresh (full life) = cool teal, about to expire / near castle = hot red.
  out.color = mix(vec3f(1.0, 0.28, 0.16), vec3f(0.32, 0.95, 0.85), ratio);
  out.uv    = o;
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
  let r = length(in.uv);
  if (r > 1.0) { discard; }
  let glow = smoothstep(1.0, 0.0, r);
  return vec4f(in.color * glow, glow);
}
`;
