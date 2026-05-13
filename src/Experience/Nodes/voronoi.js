import { add, distance, dot, float, Fn, hash, If, Loop, uv, vec2, vec4 } from 'three/tsl'

const pointsDistance = Fn(([ pointA, pointB ]) =>
{
	// Euclidean
	return distance(pointA, pointB)

	//  // Manhattan
	// return add(
	// 	pointB.x.sub(pointA.x).abs(),
	// 	pointB.y.sub(pointA.y).abs()
	// )

	//  // Chebyshev
	// return max(
	// 	pointB.x.sub(pointA.x).abs(),
	// 	pointB.y.sub(pointA.y).abs()
	// )
})

// Convert seed to [0-1] range
export const voronoiNormalizeSeed = Fn(([ seed, subdivision ]) =>
{
	return seed.div(subdivision.pow(2).sub(1)).fract()
})

// Voronoi
// - Grid-base
// - Repeating
// - Approximation AND exact distance to edge
// - Seed (can use voronoiNormalizeSeed for [0-1] range)
export const voronoi = Fn(([position = uv(), subdivision = 1, seed = 0]) =>
{
	const gridPosition = position.mul(subdivision)
	const cellPosition = gridPosition.floor()
	
	// Closest point
	const pointPosition = vec2()
	const pointDistance = float(1e6)
	const pointSeed = float(0)

	// Second closest point (for edge distance)
	const secondPointPosition = vec2()
	const secondPointDistance = float(1e6)

	// Loop to check loop cell and 8 neighbours
	Loop({ start: float(-1), end: float(1), type: 'float', condition: '<=', name: 'iX' }, ({ iX }) =>
	{
		Loop({ start: float(-1), end: float(1), type: 'float', condition: '<=', name: 'iY' }, ({ iY }) =>
		{
			// Cell position
			const loopCellPosition = cellPosition.add(vec2(iX, iY))

			// Seed from cell position
			const loopPointSeed = loopCellPosition.x.mod(subdivision).mul(subdivision).add(loopCellPosition.y.mod(subdivision)).add(seed)

			// Point position from seed
			const loopPointPosition = vec2(
				hash(loopPointSeed),
				hash(loopPointSeed.add(123.456)),
			).add(loopCellPosition)

			// Point distance
			const loopPointDistance = pointsDistance(loopPointPosition, gridPosition)

			// Loop point is closer than current
			If(loopPointDistance.lessThan(pointDistance), () =>
			{
				// Move current closest to second closest
				secondPointPosition.assign(pointPosition)
				secondPointDistance.assign(pointDistance)

				// Save as current closest
				pointPosition.assign(loopPointPosition)
				pointDistance.assign(loopPointDistance)
				pointSeed.assign(loopPointSeed)
			})
			// Loop point is closer to second closest
			.ElseIf(loopPointDistance.lessThan(secondPointDistance), () =>
			{
				// Save as second closest
				secondPointPosition.assign(loopPointPosition)
				secondPointDistance.assign(loopPointDistance)
			})
		})
	})

	// Edge distance approximation
	const edgeDistanceApproximation = secondPointDistance.sub(pointDistance).abs()

	// Exact edge distance
	const direction = secondPointPosition.sub(pointPosition).normalize()
	const middlePoint = pointPosition.add(secondPointPosition).mul(0.5)
	const edgeDistanceExact = dot(gridPosition.sub(middlePoint), direction).abs()

	return vec4(pointDistance, edgeDistanceApproximation, edgeDistanceExact, pointSeed)
})

