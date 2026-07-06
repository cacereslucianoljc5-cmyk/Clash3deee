// GPU-driven "siege" simulation built on TypeGPU + WebGPU.
//
// Thousands of enemy particles stream toward the castle at the origin. A compute
// pass moves them and resolves collisions with player blast waves entirely on
// the GPU; kills and breaches are accumulated in an atomic stats buffer that we
// read back asynchronously. A second (render) pass draws every particle as an
// additive glowing billboard.
//
// TypeGPU is used for device bootstrap and for the typed uniform / storage
// buffers (schemas in `d.*`), while the pipelines themselves are plain WebGPU so
// the code stays on TypeGPU's stable surface.

import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import { COMPUTE_WGSL, RENDER_WGSL, MAX_BLASTS } from './shaders.js';

const PARTICLE_COUNT = 24000;
const WORKGROUP_SIZE = 64;

// Schemas — field order/types mirror the WGSL structs in shaders.js.
const Particle = d.struct({
  pos: d.vec2f,
  vel: d.vec2f,
  life: d.f32,
  maxLife: d.f32,
});

const Params = d.struct({
  aspect: d.f32,
  dt: d.f32,
  time: d.f32,
  speed: d.f32,
  castleRadius: d.f32,
  count: d.u32,
  blastCount: d.u32,
  seed: d.f32,
});

const Blast = d.struct({
  pos: d.vec2f,
  radius: d.f32,
  strength: d.f32,
});

export class SiegeRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.root = null;
    this.device = null;
    this.running = false;
    this.rafId = 0;

    this.lastTime = 0;
    this.elapsed = 0;
    this.frame = 0;

    // Live gameplay state driven by the UI / input.
    this.blasts = []; // { x, y, born, maxRadius, dur }
    this.castleRadius = 0.11;
    this.speed = 0.14;

    // Cumulative counters read back from the GPU.
    this.stats = { score: 0, breaches: 0 };
    this._reading = false;

    this.onStats = null; // (stats) => void
  }

  async init() {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      throw new Error('WEBGPU_UNAVAILABLE');
    }

    // Request the adapter/device ourselves and keep hard references to them.
    // If the adapter is not retained, some backends (e.g. Dawn/SwiftShader)
    // garbage-collect the underlying instance and the device is lost mid-run.
    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) throw new Error('WEBGPU_UNAVAILABLE');
    this.gpuDevice = await this.adapter.requestDevice();

    this.root = tgpu.initFromDevice({ device: this.gpuDevice });
    const device = (this.device = this.root.device);
    device.lost.then((info) => {
      // Surface unexpected device loss instead of silently freezing.
      if (this.running) console.error('WebGPU device lost:', info.message);
    });

    const context = (this.context = this.canvas.getContext('webgpu'));
    this.format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format: this.format, alphaMode: 'premultiplied' });

    // --- Buffers (TypeGPU typed) --------------------------------------------
    this.particleBuf = this.root
      .createBuffer(d.arrayOf(Particle, PARTICLE_COUNT))
      .$usage('storage');
    this.paramsBuf = this.root.createBuffer(Params).$usage('uniform');
    this.blastBuf = this.root.createBuffer(d.arrayOf(Blast, MAX_BLASTS)).$usage('storage');

    // --- Buffers (raw, atomics + readback staging) --------------------------
    this.statsBuf = device.createBuffer({
      size: 8, // 2 x u32 atomics
      usage:
        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    this.stagingBuf = device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    this._buildComputePipelines();
    this._buildRenderPipeline();

    this.resize();
    this._resetGpuState();
    this._runInitPass();
  }

  _buildComputePipelines() {
    const device = this.device;
    const layout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      ],
    });
    const module = device.createShaderModule({ code: COMPUTE_WGSL });
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [layout] });

    this.initPipeline = device.createComputePipeline({
      layout: pipelineLayout,
      compute: { module, entryPoint: 'initMain' },
    });
    this.simPipeline = device.createComputePipeline({
      layout: pipelineLayout,
      compute: { module, entryPoint: 'simMain' },
    });

    this.computeBindGroup = device.createBindGroup({
      layout,
      entries: [
        { binding: 0, resource: { buffer: this.particleBuf.buffer } },
        { binding: 1, resource: { buffer: this.paramsBuf.buffer } },
        { binding: 2, resource: { buffer: this.blastBuf.buffer } },
        { binding: 3, resource: { buffer: this.statsBuf } },
      ],
    });
  }

  _buildRenderPipeline() {
    const device = this.device;
    const layout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
      ],
    });
    const module = device.createShaderModule({ code: RENDER_WGSL });

    this.renderPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      vertex: { module, entryPoint: 'vs' },
      fragment: {
        module,
        entryPoint: 'fs',
        targets: [
          {
            format: this.format,
            // Additive blending for the glow look.
            blend: {
              color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
            },
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
    });

    this.renderBindGroup = device.createBindGroup({
      layout,
      entries: [
        { binding: 0, resource: { buffer: this.particleBuf.buffer } },
        { binding: 1, resource: { buffer: this.paramsBuf.buffer } },
      ],
    });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor((rect.width || 640) * dpr));
    const h = Math.max(1, Math.floor((rect.height || 480) * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.aspect = this.canvas.width / this.canvas.height;
  }

  _resetGpuState() {
    this.device.queue.writeBuffer(this.statsBuf, 0, new Uint32Array([0, 0]));
    this.stats = { score: 0, breaches: 0 };
  }

  _writeParams(dt) {
    this.paramsBuf.write({
      aspect: this.aspect || 1,
      dt,
      time: this.elapsed,
      speed: this.speed,
      castleRadius: this.castleRadius,
      count: PARTICLE_COUNT,
      blastCount: Math.min(this.blasts.length, MAX_BLASTS),
      // Vary the seed each spawn wave so respawns aren't identical.
      seed: (this.frame % 4096) * 0.61803398 + this.elapsed * 0.137,
    });
  }

  _writeBlasts() {
    const now = this.elapsed;
    // Expand each shockwave over its lifetime, then retire it.
    this.blasts = this.blasts.filter((b) => now - b.born < b.dur);
    const list = [];
    for (let i = 0; i < MAX_BLASTS; i++) {
      const b = this.blasts[i];
      if (b) {
        const t = Math.min((now - b.born) / b.dur, 1);
        list.push({
          pos: d.vec2f(b.x, b.y),
          radius: b.maxRadius * (0.25 + t * 0.9),
          strength: 1 - t,
        });
      } else {
        list.push({ pos: d.vec2f(0, 0), radius: 0, strength: 0 });
      }
    }
    this.blastBuf.write(list);
  }

  _runInitPass() {
    const enc = this.device.createCommandEncoder();
    const pass = enc.beginComputePass();
    this._writeParams(0);
    pass.setPipeline(this.initPipeline);
    pass.setBindGroup(0, this.computeBindGroup);
    pass.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / WORKGROUP_SIZE));
    pass.end();
    this.device.queue.submit([enc.finish()]);
  }

  // Convert a canvas pixel coordinate into simulation world space.
  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const ndcx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcy = -(((clientY - rect.top) / rect.height) * 2 - 1);
    return { x: ndcx * (this.aspect || 1), y: ndcy };
  }

  fireBlast(clientX, clientY, radius = 0.34) {
    const { x, y } = this.screenToWorld(clientX, clientY);
    this.blasts.push({ x, y, born: this.elapsed, maxRadius: radius, dur: 0.4 });
  }

  reset() {
    this.blasts = [];
    this.elapsed = 0;
    this.frame = 0;
    this._resetGpuState();
    this._runInitPass();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = 0;
    const loop = (t) => {
      if (!this.running) return;
      // Schedule the next frame first so a transient GPU error in one frame
      // (e.g. a resize race) never permanently kills the simulation loop.
      this.rafId = requestAnimationFrame(loop);
      try {
        this._tick(t);
      } catch (err) {
        if (this.frame % 120 === 0) console.error('render tick error:', err);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  _tick(t) {
    if (!this.lastTime) this.lastTime = t;
    let dt = (t - this.lastTime) / 1000;
    this.lastTime = t;
    dt = Math.min(dt, 0.05); // clamp after tab-switch stalls
    this.elapsed += dt;
    this.frame++;

    this.resize();
    this._writeParams(dt);
    this._writeBlasts();

    const enc = this.device.createCommandEncoder();

    const cpass = enc.beginComputePass();
    cpass.setPipeline(this.simPipeline);
    cpass.setBindGroup(0, this.computeBindGroup);
    cpass.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / WORKGROUP_SIZE));
    cpass.end();

    const view = this.context.getCurrentTexture().createView();
    const rpass = enc.beginRenderPass({
      colorAttachments: [
        {
          view,
          clearValue: { r: 0.02, g: 0.02, b: 0.05, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    rpass.setPipeline(this.renderPipeline);
    rpass.setBindGroup(0, this.renderBindGroup);
    rpass.draw(6, PARTICLE_COUNT); // 6 verts (quad) per instanced particle
    rpass.end();

    // Read stats back a few times a second, not every frame.
    if (this.frame % 6 === 0 && !this._reading) {
      enc.copyBufferToBuffer(this.statsBuf, 0, this.stagingBuf, 0, 8);
    }

    this.device.queue.submit([enc.finish()]);

    if (this.frame % 6 === 0 && !this._reading) {
      this._readStats();
    }
  }

  async _readStats() {
    this._reading = true;
    try {
      await this.stagingBuf.mapAsync(GPUMapMode.READ);
      const arr = new Uint32Array(this.stagingBuf.getMappedRange().slice(0));
      this.stagingBuf.unmap();
      this.stats = { score: arr[0], breaches: arr[1] };
      if (this.onStats) this.onStats(this.stats);
    } catch (_) {
      // Buffer may be destroyed during teardown — ignore.
    } finally {
      this._reading = false;
    }
  }

  destroy() {
    this.stop();
    try {
      this.particleBuf?.destroy?.();
      this.paramsBuf?.destroy?.();
      this.blastBuf?.destroy?.();
      this.statsBuf?.destroy?.();
      this.stagingBuf?.destroy?.();
      this.root?.destroy?.();
    } catch (_) {
      /* noop */
    }
  }
}

export { PARTICLE_COUNT };
