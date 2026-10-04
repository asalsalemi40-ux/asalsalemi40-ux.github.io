/* Interactive product models. Each one loads when it nears the viewport, renders only while
   something moves, and keeps its poster image if WebGL is unavailable. */
import * as THREE from './vendor/three.min.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Vertical span and the radius around the turning axis, so the result holds at every angle.
function extent(object) {
  const yaw = object.rotation.y;
  object.rotation.y = 0;
  const box = new THREE.Box3().setFromObject(object);
  object.rotation.y = yaw;
  let reach = 0;
  for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) reach = Math.max(reach, Math.hypot(x, z));
  return { bottom: box.min.y, top: box.max.y, reach };
}

async function mount(figure) {
  const stage = figure.querySelector('.model3d-stage');
  const rangeBox = figure.querySelector('.model3d-range');
  const range = rangeBox && rangeBox.querySelector('input');
  const slider = () => (range ? range.value / 100 : 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const { default: build } = await import(`./models/${figure.dataset.model}.js`);
  const model = build();
  const view = Object.assign({ yaw: 0.6, pitch: 0.3, minPitch: 0, maxPitch: 0.8, zoom: 1, light: 1.6, environment: 0.75 }, model.view);

  // Light and shadow sizes follow the largest state the slider can reach.
  let size = 0;
  for (const t of [0, 1]) {
    if (model.set) model.set(t);
    const e = extent(model.object);
    size = Math.max(size, Math.hypot(e.reach, (e.top - e.bottom) / 2));
  }
  if (model.set) model.set(slider());

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Sized inline so the canvas can never push the stage larger, even without the stylesheet.
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = view.environment;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, view.light);
  key.position.set(-2.2 * size, 4.4 * size, 2.8 * size);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 5;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02 * size;
  Object.assign(key.shadow.camera, { left: -1.5 * size, right: 1.5 * size, top: 1.5 * size, bottom: -1.5 * size, near: 0.1 * size, far: 10 * size });
  key.shadow.camera.updateProjectionMatrix();
  scene.add(key);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12 * size, 12 * size), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  model.object.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(model.object);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.01 * size, 40 * size);

  const labels = (model.labels || []).map((l) => {
    const el = document.createElement('span');
    el.className = 'model3d-label';
    el.textContent = l.text;
    el.setAttribute('aria-hidden', 'true');
    stage.append(el);
    return Object.assign({ el }, l);
  });
  const anchor = new THREE.Vector3();

  let yaw = model.yawFor ? model.yawFor(slider()) : view.yaw;
  let pitch = view.pitch;
  let spin = 0, goal = null, drag = null, turned = false, raf = 0;
  const frame = { y: 0, distance: 0 }, framed = { y: 0, distance: 0 };

  // Distance at which the model's current extent fills the frame, from the current pitch.
  function fit() {
    const e = extent(model.object);
    const half = (e.top - e.bottom) / 2;
    const v = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tall = half * Math.cos(pitch) + e.reach * Math.sin(pitch);
    framed.y = e.bottom + half;
    framed.distance = (Math.max(tall / v, e.reach / (v * camera.aspect)) + e.reach) * view.zoom;
    if (!frame.distance || reduced) Object.assign(frame, framed);
  }

  function draw() {
    raf = 0;
    let moving = false;
    if (goal !== null) {
      const d = goal - yaw;
      if (reduced || Math.abs(d) < 0.002) { yaw = goal; goal = null; } else { yaw += d * 0.16; moving = true; }
    } else if (!drag && !reduced && Math.abs(spin) > 0.0004) {
      yaw += spin;
      spin *= 0.92;
      moving = true;
    }
    for (const k of ['y', 'distance']) {
      const d = framed[k] - frame[k];
      if (Math.abs(d) > 1e-4 * size) { frame[k] += d * 0.12; moving = true; } else frame[k] = framed[k];
    }
    model.object.rotation.y = yaw;
    camera.position.set(0, frame.y + Math.sin(pitch) * frame.distance, Math.cos(pitch) * frame.distance);
    camera.lookAt(0, frame.y, 0);
    renderer.render(scene, camera);

    const t = slider(), w = stage.clientWidth, h = stage.clientHeight;
    for (const l of labels) {
      const o = l.show(t);
      l.el.style.opacity = o;
      if (!o) continue;
      l.on.localToWorld(anchor.fromArray(l.at)).project(camera);
      l.el.style.transform = `translate(${((anchor.x + 1) / 2) * w}px, ${((1 - anchor.y) / 2) * h}px) translate(-50%, -100%)`;
    }
    if (moving) request();
  }
  const request = () => { raf = raf || requestAnimationFrame(draw); };

  new ResizeObserver(() => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fit();
    request();
  }).observe(stage);

  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, at: e.timeStamp, mouse: e.pointerType === 'mouse' };
    stage.setPointerCapture(e.pointerId);
    spin = 0;
    goal = null;
    turned = true;
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const k = 4.5 / stage.clientWidth;
    const dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k;
    yaw += dx;
    spin = dx;
    if (drag.mouse && dy) { pitch = clamp(pitch + dy * 0.5, view.minPitch, view.maxPitch); fit(); }
    Object.assign(drag, { x: e.clientX, y: e.clientY, at: e.timeStamp });
    request();
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (e.timeStamp - drag.at > 80) spin = 0;
    drag = null;
    request();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('keydown', (e) => {
    const turn = { ArrowLeft: -0.35, ArrowRight: 0.35 }[e.key];
    const tilt = { ArrowUp: -0.1, ArrowDown: 0.1 }[e.key];
    if (turn === undefined && tilt === undefined) return;
    e.preventDefault();
    turned = true;
    if (turn) goal = (goal === null ? yaw : goal) + turn;
    if (tilt) { pitch = clamp(pitch + tilt, view.minPitch, view.maxPitch); fit(); }
    request();
  });

  if (range && model.set) {
    range.addEventListener('input', () => {
      model.set(slider());
      if (model.yawFor && !turned) goal = model.yawFor(slider());
      fit();
      request();
    });
    rangeBox.hidden = false;
  }

  requestAnimationFrame(() => { draw(); stage.classList.add('is-live'); });
}

const watcher = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    watcher.unobserve(entry.target);
    mount(entry.target).catch(() => {});
  }
}, { rootMargin: '300px 0px' });
document.querySelectorAll('.model3d[data-model]').forEach((f) => watcher.observe(f));
