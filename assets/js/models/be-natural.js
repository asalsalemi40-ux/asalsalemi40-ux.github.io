/* Be Natural: the juice box as a plain board structure, bottles above and a drawer that slides out below. */
import * as THREE from '../vendor/three.min.js';

// Metres. Square footprint and height from the renders and the dieline; board as thin card.
const W = 0.2, H = 0.27, BOARD = 0.003, DRAWER = 0.075, HOLE = 0.03, TRAVEL = 0.18;

const board = new THREE.MeshStandardMaterial({ color: 0xf2ebdf, roughness: 0.88 });
const inside = new THREE.MeshStandardMaterial({ color: 0xe5d9c4, roughness: 0.92 });
const rope = new THREE.MeshStandardMaterial({ color: 0xc9a774, roughness: 0.95 });
// Dark board edges, as in the line render.
const edge = new THREE.LineBasicMaterial({ color: 0x2b2d2f, transparent: true, opacity: 0.6 });

// A flat panel w × h in its own XY plane, thickness along z, with optional holes.
function panel(w, h, mat, holes = []) {
	const shape = new THREE.Shape();
	shape.moveTo(-w / 2, -h / 2);
	shape.lineTo(w / 2, -h / 2);
	shape.lineTo(w / 2, h / 2);
	shape.lineTo(-w / 2, h / 2);
	shape.closePath();
	shape.holes.push(...holes);
	const geo = new THREE.ExtrudeGeometry(shape, { depth: BOARD, bevelEnabled: false, curveSegments: 32 });
	geo.translate(0, 0, -BOARD / 2);
	const mesh = new THREE.Mesh(geo, mat);
	mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edge));
	return mesh;
}

// Open-topped tray: base plus four walls, outer size w (x) × d (z) × h.
function tray(w, d, h) {
	const group = new THREE.Group();
	const base = panel(w, d, inside);
	base.rotation.x = -Math.PI / 2;
	base.position.y = BOARD / 2;
	group.add(base);
	for (const [len, x, z, turn] of [[w, 0, d / 2 - BOARD / 2, 0], [w, 0, -d / 2 + BOARD / 2, 0], [d, w / 2 - BOARD / 2, 0, 1], [d, -w / 2 + BOARD / 2, 0, 1]]) {
		const wall = panel(len, h, [board, inside][turn && x > 0 ? 0 : 1]);
		wall.position.set(x, h / 2, z);
		if (turn) wall.rotation.y = Math.PI / 2;
		group.add(wall);
	}
	return group;
}

export default function build() {
	const box = new THREE.Group();
	const half = W / 2, upper = H - DRAWER;

	const hole = new THREE.Path().absarc(0, 0.025, HOLE, 0, Math.PI * 2, true);
	const lid = panel(W, W, board, [hole]);
	lid.rotation.x = -Math.PI / 2;
	lid.position.y = H - BOARD / 2;
	const base = panel(W, W, board);
	base.rotation.x = -Math.PI / 2;
	base.position.y = BOARD / 2;
	const front = panel(W, H, board);
	front.position.set(0, H / 2, half - BOARD / 2);
	const back = panel(W, H, board);
	back.position.set(0, H / 2, -half + BOARD / 2);
	const left = panel(W, H, board);
	left.rotation.y = Math.PI / 2;
	left.position.set(-half + BOARD / 2, H / 2, 0);
	// The right side stops above the drawer opening; a shelf carries the bottles over the drawer.
	const right = panel(W, upper, board);
	right.rotation.y = Math.PI / 2;
	right.position.set(half - BOARD / 2, DRAWER + upper / 2, 0);
	const shelf = panel(W - 2 * BOARD, W - 2 * BOARD, inside);
	shelf.rotation.x = -Math.PI / 2;
	shelf.position.y = DRAWER + BOARD / 2;

	const handle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0042, 10, 40, Math.PI), rope);
	handle.position.set(0, H, -0.025);
	const tab = panel(0.022, 0.034, board);
	tab.rotation.y = Math.PI / 2;
	tab.position.set(half + 0.004, H - 0.03, -half + 0.03);

	const drawer = tray(W - 2 * BOARD - 0.002, W - 2 * BOARD - 0.002, DRAWER - 2 * BOARD - 0.002);
	drawer.position.y = BOARD;
	const closed = drawer.position.x;

	box.add(lid, base, front, back, left, right, shelf, handle, tab, drawer);

	const show = (t) => THREE.MathUtils.smoothstep(t, 0.45, 0.8);
	return {
		object: box,
		view: { yaw: -0.62, pitch: 0.42, zoom: 1.02 },
		set(t) {
			drawer.position.x = closed + TRAVEL * THREE.MathUtils.smootherstep(t, 0, 1);
		},
		labels: [
			{ text: 'Rope handle', on: handle, at: [0, 0.03, 0], show },
			{ text: 'Bottles above', on: right, at: [0, 0, 0], show },
			{ text: 'Drawer for a side order', on: drawer, at: [0.03, DRAWER, 0], show },
		],
	};
}
