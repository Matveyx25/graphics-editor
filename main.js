let currentShape = null;
let startPoint = null;
let endPoint = null;
let shapeCount = 0;
let splinePoints = []
let fillColor = document.querySelector('input[type="color"]')
let selectedShapes = []
const svg = document.querySelector('.drawing-canvas');
const rotateInput = document.querySelector('#rotate-input')
const scaleInput = document.querySelector('#scale-input')
const xCenterInput = document.querySelector('#x-center-input')
const yCenterInput = document.querySelector('#y-center-input')
const subtractBtn = document.querySelector('#subtract-btn')
const intersectBtn = document.querySelector('#intersect-btn')
const removeBtn = document.querySelector('#remove-btn')
let shiftDown = false;

function changeShapeType(type, id) {
	const active = currentShape === type
	const btn = document.getElementById(id)
	currentShape = !active?type : null;
	document.querySelectorAll('.element-btn').forEach(btn => btn.classList.remove('active')) 
	!active ? btn.classList.add('active') : btn.classList.add('remove')
}

function removeSelectedBounds() {
	selectedShapes?.length &&
		selectedShapes.forEach(shape => {
			document.querySelectorAll('#bounds-' + shape)?.forEach(b => b.remove())
		})
}

function removeCenters() {
	document.querySelectorAll('#center-point')?.length &&
		document.querySelectorAll('#center-point').forEach(c => c.remove())
}

function onSelectShape(name) {
	selectedShapes = name
	if(selectedShapes && selectedShapes?.length !== 0) {
		removeBtn.disabled = false
		if (selectedShapes?.length == 1) {
			rotateInput.disabled = false
			scaleInput.disabled = false
			xCenterInput.disabled = false
			yCenterInput.disabled = false

			subtractBtn.disabled = true
			intersectBtn.disabled = true

			removeCenters()
		} else {
			rotateInput.disabled = true
			scaleInput.disabled = true
			xCenterInput.disabled = true
			yCenterInput.disabled = true

			if (selectedShapes.length == 2) {
				subtractBtn.disabled = false
				intersectBtn.disabled = false
			} else {
				subtractBtn.disabled = true
				intersectBtn.disabled = true
			}
		}
		debugger
		const shape = document.getElementById(selectedShapes[selectedShapes.length - 1])
		const points = shape.getAttribute('points') ? shape.getAttribute('points').split(' ').map(point => point.split(',').map(Number)) : [[+shape.getAttribute('x1'),  +shape.getAttribute('y1')], [+shape.getAttribute('x2'),  +shape.getAttribute('y2')]];
		const centerX = (Math.min(...points.map(point => point[0])) + Math.max(...points.map(point => point[0]))) / 2;
		const centerY = (Math.min(...points.map(point => point[1])) + Math.max(...points.map(point => point[1]))) / 2;

		xCenterInput.value = centerX
		yCenterInput.value = centerY

		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		circle.setAttribute('cx', xCenterInput.value);
		circle.setAttribute('cy', yCenterInput.value);
		circle.setAttribute('r', 3);
		circle.setAttribute('style', 'fill:orange; stroke: white;');
		circle.id = 'center-point'
		svg.appendChild(circle);
	} else {
		rotateInput.disabled = true
		scaleInput.disabled = true
		xCenterInput.disabled = true
		yCenterInput.disabled = true
		removeBtn.disabled = true
		removeCenters()
	}
}

window.addEventListener('keydown', (event) => {
	if (event.key === 'Shift') {
		shiftDown = true;
	}
});

window.addEventListener('keyup', (event) => {
	if (event.key === 'Shift') {
		shiftDown = false;
	}
});

xCenterInput.addEventListener('input', () => {
	document.getElementById('center-point').setAttribute('cx', xCenterInput.value)
})

yCenterInput.addEventListener('input', () => {
	document.getElementById('center-point').setAttribute('cy', yCenterInput.value)
})

rotateInput.addEventListener('blur', () => {
	if (selectedShapes?.length == 1) {
		const angle = rotateInput.value
		rotateShape(document.getElementById(selectedShapes[0]), angle * Math.PI / 180)
	}
})

scaleInput.addEventListener('blur', () => {
	if (selectedShapes?.length == 1) {
		const d = +scaleInput.value
		scaleShape(document.getElementById(selectedShapes[0]), d)
	}
})

removeBtn.addEventListener('click', () => {
	selectedShapes?.length && selectedShapes.forEach(shapeId => {
		const shape = document.getElementById(shapeId);
		const group = document.getElementById('group-' + shapeId);
		shape.remove();
		group.remove();
		removeSelectedBounds()
		removeCenters()
	});

	onSelectShape(null)
});

subtractBtn.addEventListener('click', () => {
	TMOMethod([2, 2])
});

intersectBtn.addEventListener('click', () => {
	TMOMethod([3, 3])
});

document.getElementById('prlg-btn').addEventListener('click', () => {
	changeShapeType('parallelogram', 'prlg-btn')
});

document.getElementById('line-btn').addEventListener('click', () => {
	changeShapeType('line', 'line-btn')
});

document.getElementById('curve-btn').addEventListener('click', () => {
	changeShapeType('cubicSpline', 'curve-btn')
});

document.getElementById('corner-btn').addEventListener('click', () => {
	changeShapeType('corner', 'corner-btn')
});

document.querySelector('.drawing-canvas').addEventListener('click', (event) => {
	if (currentShape === 'corner' || currentShape === 'parallelogram' || currentShape === 'line') {
		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		circle.setAttribute('cx', event.clientX);
		circle.setAttribute('cy', event.clientY);
		circle.setAttribute('r', 5);
		circle.setAttribute('style', 'fill:red;');
		circle.classList.add('base-point')
		svg.appendChild(circle);

		if (!startPoint) {
			startPoint = {
				x: event.clientX,
				y: event.clientY
			};
		} else if (!endPoint) {
			endPoint = {
				x: event.clientX,
				y: event.clientY
			};
			drawShape();
			startPoint = null;
			endPoint = null;
		}
	} else if (currentShape === 'cubicSpline') {
		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		circle.setAttribute('cx', event.clientX);
		circle.setAttribute('cy', event.clientY);
		circle.setAttribute('r', 5);
		circle.setAttribute('style', 'fill:red;');
		circle.classList.add('base-point')
		svg.appendChild(circle);

		if (splinePoints?.length >= 3) {
			splinePoints.push({
				x: event.clientX,
				y: event.clientY
			})
			drawShape();
			splinePoints = []
		} else {
			splinePoints.push({
				x: event.clientX,
				y: event.clientY
			})
		}
	}
});

function drawLine(start, end, y, color, className, group) {
	const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	line.setAttribute('x1', start);
	line.setAttribute('y1', y);
	line.setAttribute('x2', end);
	line.setAttribute('y2', y);
	line.setAttribute('style', `stroke:${color};stroke-width:2`);
	line.setAttribute('class', `${className}`);
	group?group.appendChild(line) : svg.appendChild(line);
}

function drawPolyline(points, color, id) {
	const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
	const newPoints = points.map(p => p.toString()).join(' ')
	line.setAttribute('points', newPoints);
	line.setAttribute('style', `stroke:${color};stroke-width:2; fill: none;`);
	line.setAttribute('id', `${id}`);
	svg.appendChild(line);
}

function drawTwoPointLine(start, end, color, className, id) {
	const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	line.setAttribute('x1', start.x);
	line.setAttribute('y1', start.y);
	line.setAttribute('x2', end.x);
	line.setAttribute('y2', end.y);
	line.setAttribute('style', `stroke:${color};stroke-width:2; fill: none;`);
	className && line.setAttribute('class', `${className}`);
	if(id){
		line.setAttribute('id', `${id}`);
	}
	svg.appendChild(line);
}

function drawBoundingBox(shape) {
	const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
	const points = shape.getAttribute('points') ? shape.getAttribute('points').split(' ').map(point => point.split(',').map(Number)) : [[+shape.getAttribute('x1'),  +shape.getAttribute('y1')], [+shape.getAttribute('x2'),  +shape.getAttribute('y2')]];
	const minX = Math.min(...points.map(point => point[0]));
	const minY = Math.min(...points.map(point => point[1]));
	const maxX = Math.max(...points.map(point => point[0]));
	const maxY = Math.max(...points.map(point => point[1]));
	rect.setAttribute('x', minX);
	rect.setAttribute('y', minY);
	rect.setAttribute('width', maxX - minX);
	rect.setAttribute('height', maxY - minY);
	rect.setAttribute('style', 'fill:none;stroke: #2D9CDB;stroke-width:1');
	rect.setAttribute('id', 'bounds-' + shape.id);

	const rectPoints = [
		[minX, minY],
		[minX, maxY],
		[maxX, maxY],
		[maxX, minY]
	];

	for (let i = 0; i < rectPoints?.length; i++) {
		const x = rectPoints[i][0];
		const y = rectPoints[i][1];
		const vertex = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		vertex.setAttribute('x', x - 2);
		vertex.setAttribute('y', y - 2);
		vertex.setAttribute('width', 4);
		vertex.setAttribute('height', 4);
		vertex.setAttribute('style', 'fill: #fff;stroke: #2D9CDB;stroke-width:1');
		vertex.setAttribute('id', 'bounds-' + shape.id);
		svg.appendChild(vertex);
	}

	svg.appendChild(rect);
}

function moveShape(shape, dx, dy) {
	const points = shape.getAttribute('points') ? shape.getAttribute('points').split(' ').map(point => point.split(',').map(Number)) : [[+shape.getAttribute('x1'),  +shape.getAttribute('y1')], [+shape.getAttribute('x2'),  +shape.getAttribute('y2')]];
	const newPoints = points.map(([x, y]) => [x + dx, y + dy]);
	shape.setAttribute('points', newPoints.map(point => point.join(',')).join(' '));

	document.querySelectorAll('#bounds-' + shape.id).forEach(b => b.remove())
	drawBoundingBox(shape, shape.id)

	document.querySelectorAll('.' + shape.id).forEach(l => l.remove())
	selectedShapes.findIndex(el => el.includes('line')) == -1 ? 
	scanlineFill(shape, shape.getAttribute('color'), shape.id) : null
}

function scaleShape(shape, percent) {
	const d = percent / shape.getAttribute('scale');
	const points = shape.getAttribute('points') ? shape.getAttribute('points').split(' ').map(point => point.split(',').map(Number)) : [[+shape.getAttribute('x1'),  +shape.getAttribute('y1')], [+shape.getAttribute('x2'),  +shape.getAttribute('y2')]];
	const centerX = (Math.min(...points.map(point => point[0])) + Math.max(...points.map(point => point[0]))) / 2;
	const centerY = (Math.min(...points.map(point => point[1])) + Math.max(...points.map(point => point[1]))) / 2;

	const newPoints = points.map(([x, y]) => [centerX + (x - centerX) * d, centerY + (y - centerY) * d]);
	shape.setAttribute('points', newPoints.map(point => point.join(',')).join(' '));
	shape.setAttribute('scale', percent);

	document.querySelectorAll('#bounds-' + shape.id).forEach(b => b.remove())
	drawBoundingBox(shape, shape.id)

	document.querySelectorAll('.' + shape.id).forEach(l => l.remove())
	selectedShapes.findIndex(el => el.includes('line')) == -1 ? 
	scanlineFill(shape, shape.getAttribute('color'), shape.id) : null
}

function rotateShape(shape, angle) {
	const prevAngle = shape.getAttribute('angle')
	const points = shape.getAttribute('points') ? shape.getAttribute('points').split(' ').map(point => point.split(',').map(Number)) : [[+shape.getAttribute('x1'),  +shape.getAttribute('y1')], [+shape.getAttribute('x2'),  +shape.getAttribute('y2')]];
	const centerX = +xCenterInput.value;
	const centerY = +yCenterInput.value;
	const cosTheta = Math.cos(angle - prevAngle);
	const sinTheta = Math.sin(angle - prevAngle);
	const newPoints = points.map(([x, y]) => {
		const dx = x - centerX;
		const dy = y - centerY;
		const newX = dx * cosTheta - dy * sinTheta + centerX;
		const newY = dx * sinTheta + dy * cosTheta + centerY;
		return [newX, newY];
	});
	shape.setAttribute('angle', angle)
	shape.setAttribute('points', newPoints.map(point => point.join(',')).join(' '));

	document.querySelectorAll('#bounds-' + shape.id).forEach(b => b.remove())
	drawBoundingBox(shape, shape.id)

	document.querySelectorAll('.' + shape.id).forEach(l => l.remove())
	selectedShapes.findIndex(el => el.includes('line')) == -1 ? 
	scanlineFill(shape, shape.getAttribute('color'), shape.id) : null
}

function scanlineFill(shape, color, shapeClassName) {
	const group = document.getElementById('group-' + shape.id)
	const vertices = shape.getAttribute('points').split(' ')
		.map(point => point.split(',')
			.map(Number))
		.map(point => ({
			x: Math.floor(point[0]),
			y: Math.floor(point[1])
		}))

	if (!vertices || !color || !shapeClassName) return null
	const edges = [];

	for (let i = 0; i < vertices?.length; i++) {

		const j = (i + 1) % vertices?.length;
		if (vertices[i].y !== vertices[j].y) {
			edges.push({
				minY: Math.min(vertices[i].y, vertices[j].y),
				maxY: Math.max(vertices[i].y, vertices[j].y),
				x: vertices[i].y < vertices[j].y?vertices[i].x : vertices[j].x,
				slope: (vertices[j].x - vertices[i].x) / (vertices[j].y - vertices[i].y)
			});
		}
	}
	edges.sort((a, b) => a.minY - b.minY || a.x - b.x);

	const activeEdges = [];
	let nextY = edges[0].minY;
	while (edges?.length || activeEdges?.length) {
		for (let i = edges?.length - 1; i >= 0; i--) {
			const edge = edges[i];
			if (edge.minY === nextY) {
				activeEdges.push(edge);
				edges.splice(i, 1);
			}
		}
		activeEdges.sort((a, b) => a.x - b.x);

		for (let i = 0; i < activeEdges?.length; i += 2) {
			const start = Math.round(activeEdges[i].x);
			const end = Math.round(activeEdges[i + 1].x);
			drawLine(start, end, nextY, color, shapeClassName, group)
		}

		nextY++;
		for (let i = activeEdges?.length - 1; i >= 0; i--) {
			const edge = activeEdges[i];
			if (edge.maxY === nextY) {
				activeEdges.splice(i, 1);
			} else {
				edge.x += edge.slope;
			}
		}
	}
}

function simplifyRDP(points, epsilon) {
	let dmax = 0;
	let index = 0;
	const end = points.length - 1;

	for (let i = 1; i < end; i++) {
		const d = perpendicularDistance(points[i], points[0], points[end]);
		if (d > dmax) {
			index = i;
			dmax = d;
		}
	}

	if (dmax > epsilon) {
		const recResults1 = simplifyRDP(points.slice(0, index + 1), epsilon);
		const recResults2 = simplifyRDP(points.slice(index, end + 1), epsilon);

		const resultPoints = [...recResults1, ...recResults2.slice(1)];
		return resultPoints;
	} else {
		return [points[0], points[end]];
	}
}

function perpendicularDistance(pt, lineStart, lineEnd) {
	const dx = lineEnd[0] - lineStart[0];
	const dy = lineEnd[1] - lineStart[1];

	const mag = Math.sqrt(dx ** 2 + dy ** 2);
	if (mag <= 0.0) return 0;

	const pvx = pt[0] - lineStart[0];
	const pvy = pt[1] - lineStart[1];

	const u = ((pvx * dx) + (pvy * dy)) / (mag ** 2);

	const thePoint = [
		lineStart[0] + u * dx,
		lineStart[1] + u * dy,
	];

	return Math.sqrt(((pt[0] - thePoint[0]) ** 2) + ((pt[1] - thePoint[1]) ** 2));
}

// TMO

function countConsts(list) {
	let k = 0
	let constants = new Array()
	for (let i = 0; i < list.length; i++) {
		if (i < list.length - 1) k = i + 1;
		else k = 0;
		const c = (list[k][0] - list[i][0]) / (list[k][1] - list[i][1]);
		constants.push(c);
	}
	return constants
}

function defineXlXr(vertex, Xl, Xr, Ymin) {
	let newXl = Xl,
		newXr = Xr
	let list = [];
	let k = 0;
	let constants = countConsts(vertex);
	for (let Y = Ymin; Y < Ymin + 1; Y++) {
		for (let i = 0; i < vertex.length; i++) {
			if (i < vertex.length - 1) k = i + 1;
			else k = 0;
			if (((vertex[i][1]) < Y && (vertex[k][1] >= Y)) || ((vertex[i][1] >= Y) && (vertex[k][1] < Y))) {
				let x = Math.round(vertex[i][0] + (Y - vertex[i][1]) * constants[i]);
				list.push(x);
			}
		}
	}
	list.sort((a, b) => a - b);
	for (let i = 0; i < list.length; i += 2) {
		newXl.push(list[i]);
		newXr.push(list[i + 1]);
	}

	return {
		newXl,
		newXr
	}
}

function belongQ(Q, setQ) {
	if (setQ[0] == setQ[1] && Q == setQ[0]) return true
	else if (Q >= setQ[0] && Q <= setQ[1]) return true
	return false;
}

function TMOMethod(setQ = [1, 3]) {
	let points = selectedShapes.map(id => document.getElementById(id).getAttribute('points').split(' ').map(point => point.split(',').map(Number)))
	let YmaxA = Math.max(...points[0].map(p => p[1]));
	let YmaxB = Math.max(...points[1].map(p => p[1]));
	let YminA = Math.max(Math.min(...points[0].map(p => p[1])), 0);
	let YminB = Math.max(Math.min(...points[1].map(p => p[1])), 0);
	let Yemax = svg.clientHeight;
	YmaxA = Math.min(YmaxA, Yemax);
	YmaxB = Math.min(YmaxB, Yemax);
	let Ymaxg = YmaxA;

	let finalPoints = []

	if (YmaxB > Ymaxg) Ymaxg = YmaxB;
	
	let Yming = YminA;

	if (YminB < Yming) Yming = YminB;

	let Xemin = 0;
	let Xemax = svg.clientWidth;
	for (let Y = Yming; Y < Ymaxg; Y++) {
		let Xal = [];
		let Xar = [];
		let Xbl = [];
		let Xbr = [];
		if (Y > YminA && Y < YmaxA) {
			let define = defineXlXr(points[0], Xal, Xar, Y)
			Xal = define.newXl;
			Xar = define.newXr;
		}
		if (Y > YminB && Y < YmaxB) {
			let define = defineXlXr(points[1], Xbl, Xbr, Y)
			Xbl = define.newXl;
			Xbr = define.newXr;
		}
		let M = new Array(Xal.length * 2 + Xbl.length * 2);
		if (M.length !== 0) {
			let n = Xal.length;

			for (let i = 0; i < M.length; i++) {
				M[i] = {}
			}

			for (let i = 0; i < n; i++) {
				M[i].x = Xal[i];
				M[i].dQ = 2;
			}
			let nM = n;
			n = Xar.length;
			for (let i = 0; i < n; i++) {
				M[nM + i].x = Xar[i];
				M[nM + i].dQ = -2;
			}
			nM = nM + n;
			n = Xbl.length;
			for (let i = 0; i < n; i++) {
				M[nM + i].x = Xbl[i];
				M[nM + i].dQ = 1;
			}
			nM = nM + n;
			n = Xbr.length;
			for (let i = 0; i < n; i++) {
				M[nM + i].x = Xbr[i];
				M[nM + i].dQ = -1;
			}
			nM = nM + n;
			M.sort((a, b) => a.x - b.x);

			let Q = 0;
			let Xrl = [];
			let Xrr = [];
			if (M[0].x >= Xemin && M[0].dQ < 0) {
				Xrl.push(Xemin);
				Q = -M[0].dQ;
			}
			for (let i = 0; i < nM; i++) {
				let x = M[i].x;
				let Qnew = Q + M[i].dQ;
				if (!belongQ(Q, setQ) && belongQ(Qnew, setQ)) {
					Xrl.push(x);
				}
				if (belongQ(Q, setQ) && !belongQ(Qnew, setQ)) {
					Xrr.push(x);
				}
				Q = Qnew;
			}
			if (belongQ(Q, setQ)) {
				Xrr.push(Xemax);
			}

			for (let i = 0; i < Xrl.length; i++) {
				if (Xrl[i] < Xrr[i] && Y < Ymaxg) {
					finalPoints = [[Xrl[i], Y], ...finalPoints];
					finalPoints.push([Xrr[i], Y]);
				}
			}
		}
	}

	selectedShapes.forEach(s => {
		document.getElementById(s).remove()
		document.getElementById('group-' + s).remove()
	})

	finalPoints = simplifyRDP(finalPoints, 5)

	const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
	const linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	polygon.setAttribute('points', finalPoints.join(' '));
	polygon.setAttribute('tabindex', 0)
	polygon.setAttribute('id', 'tmo-' + shapeCount);
	polygon.setAttribute('color', 'black')
	polygon.setAttribute('scale', 100)
	polygon.setAttribute('style', 'stroke:black;fill: black; fill-opacity: 0; cursor: pointer; stroke-width:1');

	linesGroup.setAttribute('id', 'group-tmo-' + shapeCount);

	polygon.addEventListener('click', (event) => {
		event.stopPropagation();

		if (shiftDown) {
			onSelectShape([...selectedShapes, polygon.id])
			drawBoundingBox(polygon, polygon.id);
		} else {
			removeSelectedBounds()
			onSelectShape([polygon.id])
			drawBoundingBox(polygon, polygon.id);
		}
	});

	svg.appendChild(linesGroup);
	svg.appendChild(polygon);

	scanlineFill(polygon, 'black', 'tmo-' + shapeCount)

	removeCenters()
	removeSelectedBounds()
}

// События для холста

svg.addEventListener('click', (event) => {
	removeSelectedBounds()
	onSelectShape(null)
})

let isDragging = false;
let previousMousePosition = null;

svg.addEventListener('mousedown', (event) => {
	if (selectedShapes?.length == 1) {
		isDragging = true;
		previousMousePosition = {
			x: event.clientX,
			y: event.clientY
		};
	}
});

svg.addEventListener('mousemove', (event) => {
	if (isDragging && selectedShapes?.length == 1) {
		const dx = event.clientX - previousMousePosition.x;
		const dy = event.clientY - previousMousePosition.y;
		moveShape(document.getElementById(selectedShapes[0]), dx, dy);
		previousMousePosition = {
			x: event.clientX,
			y: event.clientY
		};
	}
});

svg.addEventListener('mouseup', () => {
	isDragging = false;
});

// Функции рисования фигур
function drawCubeSpline(points) {
	let L = Array(4).fill({});
	let vector1 = {};
	let vector2 = {};
	const dt = 0.04;
	let t = 0;
	let xt, yt;
	let Pt = {};
	let polylinePoints = []

	vector1.x = 4 * (points[1].x - points[0].x);
	vector1.y = 4 * (points[1].y - points[0].y);
	vector2.x = 4 * (points[3].x - points[2].x);
	vector2.y = 4 * (points[3].y - points[2].y);

	L[0] = {x: 2 * points[0].x - 2 * points[2].x + vector1.x + vector2.x, 
					y: 2 * points[0].y - 2 * points[2].y + vector1.y + vector2.y};
	L[1] = {x: -3 * points[0].x + 3 * points[2].x - 2 * vector1.x - vector2.x, 
					y: -3 * points[0].y + 3 * points[2].y - 2 * vector1.y - vector2.y};
	L[2] = {x: vector1.x, 
					y: vector1.y};
	L[3] = {x: points[0].x, 
					y: points[0].y};

	while (t < 1 + dt / 2) {
		xt = ((L[0].x * t + L[1].x) * t + L[2].x) * t + L[3].x;
		yt = ((L[0].y * t + L[1].y) * t + L[2].y) * t + L[3].y;
		Pt.x = Math.round(xt);
		Pt.y = Math.round(yt);

		polylinePoints.push([Pt.x, Pt.y])

		t = t + dt;
	}

	drawPolyline(polylinePoints, fillColor.value, 'spline-' + shapeCount);
	const spline = document.getElementById('spline-' + shapeCount)
	spline.setAttribute('color', fillColor.value)
	spline.setAttribute('scale', 100)

	spline.addEventListener('click', (event) => {
		event.stopPropagation();

		if (shiftDown) {
			onSelectShape([...selectedShapes, spline.id])
			drawBoundingBox(spline, spline.id);
		} else {
			removeSelectedBounds()
			onSelectShape([spline.id])
			drawBoundingBox(spline, spline.id);
		}
	});
}

function drawParallelogram(points) {
	const parallelogram = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
	const linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	parallelogram.setAttribute('tabindex', 0)
	parallelogram.setAttribute('points', points);
	parallelogram.setAttribute('id', 'parallelogram-' + shapeCount);
	linesGroup.setAttribute('id', 'group-parallelogram-' + shapeCount);
	parallelogram.setAttribute('color', fillColor.value)
	parallelogram.setAttribute('scale', 100)
	parallelogram.setAttribute('style', 'stroke:black;fill: black; fill-opacity: 0; cursor: pointer; stroke-width:1');

	parallelogram.addEventListener('click', (event) => {
		event.stopPropagation();

		if (shiftDown) {
			onSelectShape([...selectedShapes, parallelogram.id])
			drawBoundingBox(parallelogram, parallelogram.id);
		} else {
			removeSelectedBounds()
			onSelectShape([parallelogram.id])
			drawBoundingBox(parallelogram, parallelogram.id);
		}
	});

	svg.appendChild(linesGroup);
	svg.appendChild(parallelogram);

	scanlineFill(parallelogram, fillColor.value, 'parallelogram-' + shapeCount)
}

function drawCorner(points) {
	const corner = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
	const linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	corner.setAttribute('tabindex', 0)
	corner.setAttribute('points', points);
	corner.setAttribute('id', 'corner-' + shapeCount);
	linesGroup.setAttribute('id', 'group-corner-' + shapeCount);
	corner.setAttribute('color', fillColor.value)
	corner.setAttribute('scale', 100)
	corner.setAttribute('style', 'stroke:black;fill: black; fill-opacity: 0; cursor: pointer; stroke-width:1');

	corner.addEventListener('click', (event) => {
		event.stopPropagation();

		if (shiftDown) {
			onSelectShape([...selectedShapes, corner.id])
			drawBoundingBox(corner, corner.id);
		} else {
			removeSelectedBounds()
			onSelectShape([corner.id])
			drawBoundingBox(corner, corner.id);
		}
	});

	svg.appendChild(linesGroup);
	svg.appendChild(corner);

	scanlineFill(corner, fillColor.value, 'corner-' + shapeCount)
}

function drawShape() {
	if (currentShape === 'parallelogram') {
		const width = startPoint.x - endPoint.x;
		const tl = `${startPoint.x},${startPoint.y}`
		const tr = `${endPoint.x + width * .3},${startPoint.y}`
		const bl = `${endPoint.x},${endPoint.y}`
		const br = `${startPoint.x - width * .3},${endPoint.y}`
		const points = `${tl} ${tr} ${bl} ${br}`;
		drawParallelogram(points)
	} else if (currentShape === 'cubicSpline') {
		drawCubeSpline(splinePoints);
	}else if(currentShape === 'line'){
		drawTwoPointLine(startPoint, endPoint, fillColor.value, null, 'line-' + shapeCount)
		const line = document.getElementById('line-' + shapeCount)
		line.setAttribute('color', fillColor.value)
		line.setAttribute('scale', 100)

		line.addEventListener('click', (event) => {
			event.stopPropagation();

			if (shiftDown) {
				onSelectShape([...selectedShapes, line.id])
				drawBoundingBox(line, line.id);
			} else {
				removeSelectedBounds()
				onSelectShape([line.id])
				drawBoundingBox(line, line.id);
			}
		});
	} else if (currentShape === 'corner') {
		const width = startPoint.x - endPoint.x;
		const height = startPoint.y - endPoint.y;
		const p1 = `${startPoint.x},${startPoint.y}`
		const p2 = `${endPoint.x},${startPoint.y}`
		const p3 = `${endPoint.x - width/3},${startPoint.y + height/3}`
		const p4 = `${startPoint.x + width/3},${startPoint.y + height/3}`
		const p5 = `${startPoint.x + width/3},${endPoint.y - height/3}`
		const p6 = `${startPoint.x},${endPoint.y}`
		const points = `${p1} ${p2} ${p3} ${p4} ${p5} ${p6}`;
		drawCorner(points)
	}

	currentShape = null
	document.querySelectorAll('.element-btn').forEach(btn => btn.classList.remove('active'))
	document.querySelectorAll('.base-point').forEach(p => p.remove())

	shapeCount++
}