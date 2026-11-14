/* Cut, model two: storage side panel, clapperboard backrest and seat, with an exploded view. */
import * as THREE from '../vendor/three.min.js';

// Metres. Overall size follows model one (560 wide, seat at 450); depth and backrest follow the renders.
const W = 0.56, D = 0.52, H = 0.88, SEAT = 0.45, PANEL = 0.024, BACK = 0.06, BEVEL = 0.003;
const INNER = W - 2 * PANEL;
const OUT = -W / 2; // outer face of the storage panel

const mat = {
	panel: new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.62 }),
	alu: new THREE.MeshStandardMaterial({ color: 0x232629, metalness: 0.7, roughness: 0.36 }),
	fabric: new THREE.MeshPhysicalMaterial({ color: 0x3b3e41, roughness: 0.94, sheen: 0.6, sheenRoughness: 0.8, sheenColor: 0x8f949a }),
	black: new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.5 }),
};

// Polygon with every corner rounded by r (convex and concave alike).
function rounded(points, r) {
	const shape = new THREE.Shape();
	const n = points.length;
	points.forEach((p, i) => {
		const a = points[(i + n - 1) % n], b = points[(i + 1) % n];
		const toward = (q) => {
			const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy), k = Math.min(r, len / 2) / len;
			return [p[0] + dx * k, p[1] + dy * k];
		};
		const s = toward(a), e = toward(b);
		if (i === 0) shape.moveTo(s[0], s[1]); else shape.lineTo(s[0], s[1]);
		shape.quadraticCurveTo(p[0], p[1], e[0], e[1]);
	});
	shape.closePath();
	return shape;
}

// Rounded plate: w across x, h up y, thickness centred on z. Faces take mats[0], edges mats[1].
function plate(w, h, thick, r, mats, bevel = BEVEL) {
	const shape = rounded([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], r);
	const geo = new THREE.ExtrudeGeometry(shape, { depth: thick - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 });
	geo.translate(0, 0, -(thick - 2 * bevel) / 2);
	return new THREE.Mesh(geo, mats);
}

// Same plate lying flat: w across x, d along z, thickness up y.
function slab(w, d, thick, r, mats) {
	const mesh = plate(w, d, thick, r, mats);
	mesh.geometry.rotateX(-Math.PI / 2);
	return mesh;
}

function stripes(w, h, slant) {
	const c = document.createElement('canvas');
	c.width = 1024;
	c.height = Math.round((1024 * h) / w);
	const g = c.getContext('2d');
	g.fillStyle = '#eeebe4';
	g.fillRect(0, 0, c.width, c.height);
	g.fillStyle = '#1f2225';
	const period = c.width / 2.4, band = period * 0.46, skew = c.height * 0.8 * slant;
	for (let x = -2 * period; x < c.width + period; x += period) {
		g.beginPath();
		g.moveTo(x, 0);
		g.lineTo(x + band, 0);
		g.lineTo(x + band + skew, c.height);
		g.lineTo(x + skew, c.height);
		g.fill();
	}
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 8;
	tex.repeat.set(1 / w, 1 / h);
	tex.offset.set(0.5, 0.5);
	return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42 });
}

function sidePanel(profile) {
	const geo = new THREE.ExtrudeGeometry(rounded(profile, 0.012), { depth: PANEL - 2 * BEVEL, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 2, curveSegments: 6 });
	geo.translate(0, 0, -(PANEL - 2 * BEVEL) / 2);
	geo.rotateY(-Math.PI / 2); // profile x runs back to front
	return new THREE.Mesh(geo, [mat.panel, mat.alu]);
}

export default function build() {
	const chair = new THREE.Group();
	chair.position.z = -D / 2;

	// Profiles in (depth from the back, height). The storage side is cut on the diagonal.
	const left = sidePanel([[0, 0], [D, 0], [BACK, SEAT], [BACK, H], [0, H]]);
	left.position.x = OUT + PANEL / 2;
	const right = sidePanel([[0, 0], [D, 0], [D, SEAT], [BACK, SEAT], [BACK, H], [0, H]]);
	right.position.x = W / 2 - PANEL / 2;

	const topH = 0.1, gap = 0.012, ledgeH = 0.06;
	const bottomH = H - topH - gap - SEAT - ledgeH;
	const top = plate(INNER, topH, BACK, 0.008, [stripes(INNER, topH, 1), mat.alu]);
	top.position.set(0, H - topH / 2, BACK / 2);
	const bottom = plate(INNER, bottomH, BACK, 0.008, [stripes(INNER, bottomH, -1), mat.alu]);
	bottom.position.set(0, SEAT + ledgeH + bottomH / 2, BACK / 2);
	const ledge = plate(INNER, ledgeH - 0.004, 0.075, 0.012, [mat.alu, mat.alu]);
	ledge.position.set(0, SEAT + ledgeH / 2, BACK + 0.02);

	const seat = slab(INNER - 0.002, D - BACK - 0.006, 0.055, 0.012, [mat.fabric, mat.alu]);
	seat.position.set(0, SEAT - 0.0275, BACK + (D - BACK) / 2);
	const apron = plate(INNER, 0.05, 0.022, 0.004, [mat.alu, mat.alu]);
	apron.position.set(0, SEAT - 0.08, D - 0.011);
	const back = plate(INNER, SEAT - 0.09, 0.016, 0.004, [mat.panel, mat.alu]);
	back.position.set(0, 0.025 + (SEAT - 0.09) / 2, 0.012);
	const stretcher = plate(INNER, 0.03, 0.03, 0.006, [mat.alu, mat.alu]);
	stretcher.position.set(0, 0.11, 0.05);

	// Storage on the outer face of the diagonal panel: a tray with a tablet case, a notebook slot, a headphone hook.
	const pocket = new THREE.Group();
	const tray = slab(0.05, 0.15, 0.03, 0.006, [mat.panel, mat.alu]);
	tray.position.set(OUT - 0.025, 0.215, 0.09);
	const tablet = plate(0.115, 0.13, 0.034, 0.012, [mat.black, mat.black]);
	tablet.rotation.y = Math.PI / 2;
	tablet.position.set(OUT - 0.022, 0.23 + 0.065, 0.09);
	const handle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0045, 8, 24, Math.PI), mat.black);
	handle.rotation.y = Math.PI / 2;
	handle.position.set(OUT - 0.022, 0.36, 0.09);
	const slot = plate(0.15, 0.11, 0.008, 0.006, [mat.alu, mat.alu]);
	slot.rotation.y = Math.PI / 2;
	slot.position.set(OUT - 0.004, 0.11, 0.1);
	const notebook = plate(0.125, 0.088, 0.008, 0.004, [mat.black, mat.black]);
	notebook.rotation.y = Math.PI / 2;
	notebook.position.set(OUT - 0.009, 0.11, 0.1);
	const hookY = 0.25, hookZ = 0.235, band = 0.042;
	const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.034, 12), mat.alu);
	hook.rotation.z = Math.PI / 2;
	hook.position.set(OUT - 0.017, hookY, hookZ);
	const headband = new THREE.Mesh(new THREE.TorusGeometry(band, 0.0055, 10, 32, Math.PI), mat.black);
	headband.rotation.y = Math.PI / 2;
	headband.position.set(OUT - 0.03, hookY - band - 0.006, hookZ);
	pocket.add(tray, tablet, handle, slot, notebook, hook, headband);
	for (const side of [-1, 1]) {
		const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.022, 28), mat.black);
		cup.rotation.z = Math.PI / 2;
		cup.position.set(OUT - 0.03, hookY - band - 0.016, hookZ + side * band);
		pocket.add(cup);
	}

	chair.add(left, right, top, bottom, ledge, seat, apron, back, stretcher, pocket);
	const root = new THREE.Group();
	root.add(chair);

	// Exploded view: every part slides out along the axis it was assembled on.
	const moves = [
		[left, -0.2, 0, 0], [pocket, -0.32, 0, 0], [right, 0.2, 0, 0],
		[top, 0, 0.24, 0], [bottom, 0, 0.14, 0], [ledge, 0, 0.08, 0.03], [seat, 0, 0.035, 0.05],
		[apron, 0, -0.02, 0.13], [back, 0, 0, -0.17], [stretcher, 0, 0, -0.1],
	].map(([part, x, y, z]) => ({ part, base: part.position.clone(), offset: new THREE.Vector3(x, y, z) }));

	const show = (t) => THREE.MathUtils.smoothstep(t, 0.5, 0.85);
	return {
		object: root,
		view: { pitch: 0.34, zoom: 1 },
		// Swing towards the front while exploding, where the parts separate across the view.
		yawFor: (t) => 1.2 - 0.55 * THREE.MathUtils.smootherstep(t, 0, 1),
		set(t) {
			const e = THREE.MathUtils.smootherstep(t, 0, 1);
			for (const m of moves) m.part.position.copy(m.base).addScaledVector(m.offset, e);
		},
		labels: [
			{ text: 'Clapperboard backrest', on: top, at: [0, 0.06, 0], show },
			{ text: 'Seat', on: seat, at: [0.1, 0.035, 0.05], show },
			{ text: 'Tablet and headphone pocket', on: tablet, at: [0, 0.1, 0], show },
		],
	};
}
