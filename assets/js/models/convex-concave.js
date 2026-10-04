/* Convex / Concave: the pencil silhouette given depth, from the outline on paper to the felt volume. */
import * as THREE from '../vendor/three.min.js';

// Traced from the pencil silhouette study: the outline and the seam between the two shells,
// as x, y pairs at a height of 1, centred.
const OUTLINE = [.293,-.499,.275,-.500,.256,-.498,.238,-.495,.220,-.492,.202,-.488,.185,-.482,.168,-.476,.150,-.469,.133,-.462,.116,-.456,.099,-.450,.081,-.444,.063,-.440,.045,-.438,.027,-.438,.008,-.438,-.010,-.440,-.028,-.442,-.046,-.446,-.064,-.450,-.082,-.455,-.100,-.460,-.117,-.464,-.136,-.468,-.154,-.470,-.172,-.470,-.190,-.469,-.209,-.468,-.227,-.465,-.244,-.459,-.261,-.451,-.277,-.441,-.289,-.428,-.300,-.414,-.311,-.399,-.322,-.384,-.337,-.374,-.355,-.372,-.372,-.378,-.385,-.391,-.395,-.407,-.407,-.421,-.422,-.431,-.439,-.437,-.458,-.436,-.475,-.429,-.489,-.417,-.500,-.403,-.509,-.387,-.516,-.370,-.521,-.352,-.527,-.335,-.531,-.317,-.535,-.299,-.539,-.281,-.542,-.263,-.544,-.245,-.546,-.226,-.549,-.208,-.551,-.190,-.553,-.172,-.554,-.153,-.554,-.135,-.554,-.117,-.554,-.098,-.552,-.080,-.551,-.061,-.550,-.043,-.549,-.025,-.548,-.006,-.547,.012,-.547,.030,-.544,.049,-.541,.067,-.536,.084,-.530,.102,-.525,.119,-.521,.137,-.517,.155,-.513,.173,-.507,.191,-.501,.208,-.494,.225,-.487,.242,-.481,.259,-.473,.276,-.464,.292,-.452,.305,-.437,.316,-.419,.322,-.401,.323,-.383,.319,-.367,.310,-.354,.298,-.343,.283,-.335,.266,-.328,.249,-.319,.233,-.307,.219,-.293,.207,-.277,.198,-.260,.194,-.241,.191,-.223,.191,-.205,.193,-.187,.198,-.170,.205,-.156,.217,-.143,.230,-.134,.246,-.128,.263,-.127,.282,-.126,.300,-.125,.318,-.125,.337,-.132,.354,-.141,.369,-.154,.383,-.170,.391,-.188,.395,-.206,.398,-.224,.398,-.218,.415,-.206,.428,-.191,.439,-.174,.447,-.158,.455,-.141,.462,-.124,.469,-.106,.475,-.089,.480,-.071,.484,-.053,.489,-.035,.493,-.017,.496,.001,.498,.019,.498,.038,.499,.056,.500,.075,.499,.093,.498,.111,.496,.130,.494,.147,.491,.166,.488,.184,.484,.202,.480,.219,.474,.236,.468,.253,.461,.270,.452,.286,.444,.301,.434,.317,.424,.329,.410,.341,.397,.359,.393,.377,.394,.395,.391,.413,.387,.430,.380,.447,.372,.463,.363,.478,.353,.492,.341,.505,.328,.516,.314,.526,.298,.534,.281,.540,.264,.545,.246,.548,.228,.551,.210,.553,.192,.554,.173,.552,.155,.550,.137,.544,.119,.538,.102,.533,.085,.527,.067,.520,.050,.514,.033,.507,.016,.500,-.001,.493,-.018,.488,-.036,.487,-.054,.486,-.073,.484,-.091,.482,-.109,.482,-.128,.486,-.145,.492,-.163,.498,-.180,.505,-.198,.510,-.215,.517,-.232,.522,-.250,.523,-.268,.523,-.286,.522,-.305,.520,-.323,.516,-.341,.511,-.359,.504,-.376,.495,-.392,.485,-.407,.474,-.422,.463,-.436,.448,-.448,.432,-.457,.416,-.466,.399,-.473,.382,-.480,.365,-.486,.347,-.490,.329,-.494,.311,-.497];
const SEAM = [-.285,-.383,-.263,-.375,-.243,-.360,-.229,-.341,-.219,-.319,-.213,-.295,-.209,-.271,-.206,-.247,-.202,-.223,-.197,-.200,-.193,-.176,-.188,-.152,-.180,-.129,-.172,-.106,-.164,-.083,-.154,-.061,-.143,-.040,-.131,-.018,-.118,.002,-.104,.022,-.088,.040,-.071,.058,-.054,.075,-.037,.091,-.018,.107,.002,.121,.023,.133,.045,.143,.067,.154,.089,.163,.112,.172,.135,.179,.158,.186,.182,.191,.206,.196,.230,.201,.254,.205,.277,.210,.301,.215,.324,.223,.346,.232,.366,.246,.382,.264,.394,.285,.397,.309,.392,.333,.380,.353,.360,.367];
const DEPTH = 0.4; // full depth, relative to the height, as in the felt prototype

const points = (a) => Array.from({ length: a.length / 2 }, (_, i) => new THREE.Vector2(a[2 * i], a[2 * i + 1]));
const outline = points(OUTLINE);
const seam = points(SEAM);
const shape = new THREE.Shape(outline);
const inward = THREE.ShapeUtils.isClockWise(outline) ? -1 : 1;

const paper = new THREE.Color(0xf6f4ef), felt = new THREE.Color(0x6f7072);
const pencil = new THREE.Color(0x3b3c3d), thread = new THREE.Color(0x3f4143);

// Felt: short random fibres, drawn into all nine neighbouring tiles so the texture repeats without seams.
function fibres(base, shades, count, alpha) {
	const size = 256, c = document.createElement('canvas');
	c.width = c.height = size;
	const g = c.getContext('2d');
	g.fillStyle = base;
	g.fillRect(0, 0, size, size);
	for (let i = 0; i < count; i++) {
		const x = Math.random() * size, y = Math.random() * size, a = Math.random() * Math.PI, l = 2 + Math.random() * 8;
		g.strokeStyle = `rgba(${shades[i % shades.length]},${alpha * (0.5 + Math.random())})`;
		g.lineWidth = 0.5 + Math.random() * 0.8;
		for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
			g.beginPath();
			g.moveTo(x + dx, y + dy);
			g.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l);
			g.stroke();
		}
	}
	const tex = new THREE.CanvasTexture(c);
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(7, 7);
	tex.anisotropy = 4;
	return tex;
}

function tube(pts, closed, material) {
	const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)), closed);
	return new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 3, 0.0035, 6, closed), material);
}

export default function build() {
	const grain = fibres('#ffffff', ['40,42,44', '255,255,255', '90,92,95'], 4200, 0.3);
	grain.colorSpace = THREE.SRGBColorSpace;
	const skin = new THREE.MeshPhysicalMaterial({
		color: felt, map: grain, roughness: 1,
		sheen: 1, sheenRoughness: 0.42, sheenColor: 0xc3c7cb,
		bumpMap: fibres('#808080', ['0,0,0', '255,255,255'], 4200, 0.22),
	});
	const body = new THREE.Mesh(new THREE.BufferGeometry(), skin);
	body.position.y = 0.5;

	const line = new THREE.MeshBasicMaterial({ color: pencil, transparent: true });
	const seamLine = new THREE.MeshStandardMaterial({ color: pencil, roughness: 0.9 });
	const faces = [1, -1].map((side) => {
		const face = new THREE.Group();
		face.add(tube(outline, true, line), tube(seam, false, seamLine));
		body.add(face);
		return { side, face };
	});

	// Blanket stitches over the edge, on both faces.
	const every = 2, count = Math.floor(outline.length / every);
	const stitchMat = new THREE.MeshStandardMaterial({ color: thread, roughness: 0.8, transparent: true });
	const stitches = new THREE.InstancedMesh(new THREE.BoxGeometry(0.004, 0.026, 0.004), stitchMat, count * 2);
	body.add(stitches);
	const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), z = new THREE.Vector3(0, 0, 1);

	const object = new THREE.Group();
	object.add(body);

	return {
		object,
		view: { pitch: 0.14, zoom: 1.05, environment: 0.85 },
		yawFor: (t) => 0.8 * THREE.MathUtils.smootherstep(t, 0, 1),
		set(t) {
			const thick = 0.012 + DEPTH * t, bevel = Math.min(0.05, thick * 0.3);
			body.geometry.dispose();
			body.geometry = new THREE.ExtrudeGeometry(shape, { depth: thick - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 5, curveSegments: 1 });
			body.geometry.translate(0, 0, -(thick - 2 * bevel) / 2);

			const k = THREE.MathUtils.smoothstep(t, 0.04, 0.4);
			skin.color.lerpColors(paper, felt, k);
			skin.sheen = k;
			skin.bumpScale = 6 * k;
			line.opacity = 1 - THREE.MathUtils.smoothstep(t, 0.12, 0.42);
			line.visible = line.opacity > 0;
			seamLine.color.lerpColors(pencil, thread, k);
			stitchMat.opacity = THREE.MathUtils.smoothstep(t, 0.3, 0.7);
			stitches.visible = stitchMat.opacity > 0;

			for (const { side, face } of faces) face.position.z = side * (thick / 2 + 0.002);
			for (let i = 0; i < count; i++) {
				const a = outline[i * every], b = outline[(i * every + 1) % outline.length];
				const nx = -(b.y - a.y) * inward, ny = (b.x - a.x) * inward, n = Math.hypot(nx, ny);
				q.setFromAxisAngle(z, Math.atan2(ny / n, nx / n) - Math.PI / 2);
				for (const side of [0, 1]) {
					pos.set(a.x + (nx / n) * 0.016, a.y + (ny / n) * 0.016, (side ? -1 : 1) * (thick / 2 + 0.001));
					stitches.setMatrixAt(i * 2 + side, m.compose(pos, q, one));
				}
			}
			stitches.instanceMatrix.needsUpdate = true;
		},
	};
}
