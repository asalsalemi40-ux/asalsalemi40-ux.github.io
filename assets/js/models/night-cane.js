/* Night Cane: a four-footed cane with a warm LED in the front of its handle. The slider turns
   the room dark and the light on, so the pool of light it throws on the floor ahead shows. */
import * as THREE from '../vendor/three.min.js';

const { smoothstep, lerp } = THREE.MathUtils;

// Metres. Proportions from the concept sketch: handle top about 0.87 m, base about 0.2 m across.
const TOP = 0.865, FOOT = 0.1, LENS_X = 0.062;

const metal = new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.85, roughness: 0.32 });
const grip = new THREE.MeshStandardMaterial({ color: 0x5f656b, roughness: 0.62 });
const gripTop = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.5 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x2b2e31, roughness: 0.9 });
const button = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.55 });
const lens = new THREE.MeshStandardMaterial({ color: 0xfff3e0, emissive: 0xffc982, emissiveIntensity: 0.1, roughness: 0.2 });

// A soft radial fade, so the floor has no hard edge in the dark.
function fade() {
	const c = document.createElement('canvas');
	c.width = c.height = 256;
	const g = c.getContext('2d');
	const r = g.createRadialGradient(128, 128, 10, 128, 128, 128);
	r.addColorStop(0, '#fff');
	r.addColorStop(0.55, '#bbb');
	r.addColorStop(1, '#000');
	g.fillStyle = r;
	g.fillRect(0, 0, 256, 256);
	return new THREE.CanvasTexture(c);
}

function mesh(geo, mat, x = 0, y = 0, z = 0) {
	const m = new THREE.Mesh(geo, mat);
	m.position.set(x, y, z);
	return m;
}

export default function build() {
	const cane = new THREE.Group();

	// Base: a hub with four curved legs on rubber feet, on the diagonals.
	const base = new THREE.Group();
	base.add(mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.03, 40), metal, 0, 0.052, 0));
	const feet = [];
	for (let i = 0; i < 4; i++) {
		const a = Math.PI / 4 + (i * Math.PI) / 2, dx = Math.cos(a), dz = Math.sin(a);
		const path = new THREE.CatmullRomCurve3([
			new THREE.Vector3(0.02 * dx, 0.055, 0.02 * dz),
			new THREE.Vector3(0.055 * dx, 0.05, 0.055 * dz),
			new THREE.Vector3(0.085 * dx, 0.034, 0.085 * dz),
			new THREE.Vector3(FOOT * dx, 0.024, FOOT * dz),
		]);
		base.add(new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.0105, 14), metal));
		const foot = mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.024, 28), rubber, FOOT * dx, 0.012, FOOT * dz);
		base.add(foot);
		feet.push(foot);
	}
	// Dark ferrule where the shaft meets the base.
	base.add(mesh(new THREE.CylinderGeometry(0.0155, 0.018, 0.05, 32), rubber, 0, 0.09, 0));
	cane.add(base);

	// Telescopic shaft: a wider lower tube, a narrower upper tube, a locking collar between them.
	cane.add(mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.43, 32), metal, 0, 0.11 + 0.215, 0));
	cane.add(mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.008, 32), metal, 0, 0.3, 0));
	const collar = mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.04, 32), rubber, 0, 0.52, 0);
	cane.add(collar);
	collar.add(mesh(new THREE.SphereGeometry(0.0035, 12, 8), metal, 0, 0, 0.0145));
	cane.add(mesh(new THREE.CylinderGeometry(0.0098, 0.0098, 0.3, 32), metal, 0, 0.54 + 0.15, 0));
	cane.add(mesh(new THREE.CylinderGeometry(0.0135, 0.0135, 0.012, 32), metal, 0, 0.8, 0));

	// Neck: a soft-touch flare from the shaft up into the handle.
	const neck = new THREE.LatheGeometry([
		new THREE.Vector2(0.0122, 0), new THREE.Vector2(0.0135, 0.02), new THREE.Vector2(0.017, 0.038), new THREE.Vector2(0.021, 0.05),
	], 40);
	cane.add(mesh(neck, grip, 0, 0.806, 0));

	// Handle: a rounded grip lying forward, flat at the front where the LED sits.
	const handle = new THREE.Group();
	handle.position.set(0, TOP, 0);
	const body = mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.095, 40), grip, 0.0145, 0, 0);
	body.rotation.z = Math.PI / 2;
	body.scale.set(1, 1, 0.94);
	const back = mesh(new THREE.SphereGeometry(0.021, 40, 20), grip, -0.033, 0, 0);
	back.scale.set(1.15, 1, 0.94);
	const top = mesh(new THREE.CylinderGeometry(0.0212, 0.0212, 0.07, 40, 1, false, -Math.PI / 2.6, Math.PI / 1.3), gripTop, 0.008, 0.0004, 0);
	top.rotation.z = Math.PI / 2;
	const bezel = mesh(new THREE.TorusGeometry(0.0172, 0.0032, 12, 40), metal, LENS_X, 0, 0);
	bezel.rotation.y = Math.PI / 2;
	const glass = mesh(new THREE.CircleGeometry(0.0172, 40), lens, LENS_X + 0.0005, 0, 0);
	glass.rotation.y = Math.PI / 2;
	const key = mesh(new THREE.BoxGeometry(0.014, 0.0075, 0.005), button, 0.036, 0.004, 0.0205);
	handle.add(body, back, top, bezel, glass, key);
	cane.add(handle);

	// The light: warm, aimed forward and down at the floor a step or two ahead.
	const aim = new THREE.Object3D();
	aim.position.set(0.55, 0, 0);
	const spot = new THREE.SpotLight(0xffd7a8, 0, 3.2, 0.5, 0.7, 1.4);
	spot.position.set(LENS_X + 0.004, TOP, 0);
	spot.target = aim;
	cane.add(aim, spot);

	// Floor for the night scene: only visible once the room is dark.
	const floorMat = new THREE.MeshStandardMaterial({ color: 0x45403b, roughness: 0.74, transparent: true, opacity: 0, alphaMap: fade(), depthWrite: false });
	const floor = mesh(new THREE.CircleGeometry(1.3, 64), floorMat, 0.3, 0.0006, 0);
	floor.rotation.x = -Math.PI / 2;
	floor.userData.ignoreFit = true;
	floor.userData.noShadow = true;
	floor.receiveShadow = true;
	cane.add(floor);

	const night = (t) => smoothstep(t, 0, 0.55);
	const on = (t) => smoothstep(t, 0.35, 0.85);
	const day = (t) => 1 - smoothstep(t, 0.12, 0.3);
	const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

	return {
		object: cane,
		view: { yaw: 0.3, pitch: 0.26, zoom: 0.98, swing: 0.5 },
		set(t) {
			spot.intensity = 16 * on(t);
			lens.emissiveIntensity = 0.1 + 5 * on(t);
			floorMat.opacity = night(t);
		},
		mood(t, { scene, key: sun, ground, stage, view }) {
			const n = night(t);
			scene.environmentIntensity = lerp(view.environment, 0.07, n);
			sun.intensity = lerp(view.light, 0.12, n);
			ground.material.opacity = lerp(0.16, 0, n);
			stage.style.background = `radial-gradient(120% 95% at 50% 30%, ${mix(0xfcfcfb, 0x2c2723, n)} 0%, ${mix(0xf1f2f0, 0x111012, n)} 72%)`;
		},
		labels: [
			{ text: 'One large button', on: key, at: [0, 0.004, 0.003], show: day },
			{ text: 'Height lock', on: collar, at: [0, 0.02, 0.015], show: day },
			{ text: 'Four rubber feet', on: feet[0], at: [0, 0.012, 0], show: day },
			{ text: 'Warm light on the floor ahead', on: aim, at: [0, 0.02, 0], show: (t) => smoothstep(t, 0.7, 0.9) },
		],
	};
}
