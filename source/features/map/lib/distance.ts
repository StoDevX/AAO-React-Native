import type {Coordinate} from '../types'

/// The squared distance from `p` to the segment `a`-`b`, with longitude
/// shrunk by `p`'s latitude so east-west and north-south count alike. Only
/// compared, never shown, so neither the root nor the units matter.
export function segmentDistanceSquared(
	a: GeoJSON.Position,
	b: GeoJSON.Position,
	p: Coordinate,
): number {
	let shrink = Math.cos((p[1] * Math.PI) / 180)
	let [ax, ay] = [a[0] * shrink, a[1]]
	let [bx, by] = [b[0] * shrink, b[1]]
	let [px, py] = [p[0] * shrink, p[1]]
	let [dx, dy] = [bx - ax, by - ay]
	let length = dx * dx + dy * dy
	let t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length))
	return (ax + t * dx - px) ** 2 + (ay + t * dy - py) ** 2
}

/// The squared distance from `a` to `touch`: a segment of no length.
export function distanceSquared(a: Coordinate, touch: Coordinate): number {
	return segmentDistanceSquared(a, a, touch)
}
