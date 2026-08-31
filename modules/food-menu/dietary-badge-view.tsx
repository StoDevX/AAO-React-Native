import * as React from 'react'
import {Text} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	frame,
	kerning,
	lineLimit,
	minimumScaleFactor,
	shapes,
} from '@expo/ui/swift-ui/modifiers'

import {BADGE_POINT_SIZE, BADGE_SIDE, type DietaryBadgeType} from './lib/dietary-badge'

/**
 * A circle rather than a capsule, and a fixed one: "VG" in a capsule would be
 * wider than "V" and the trailing run of badges would go ragged from row to
 * row. `minimumScaleFactor` shrinks the two-character tokens to fit instead.
 *
 * Built once per fill and cached, because a meal draws hundreds of these and an
 * inline array would allocate fresh modifier objects for every one.
 */
const byToken = new Map<string, ReturnType<typeof font>[]>()

function badgeModifiers(fill: string, kern: number) {
	let cacheKey = `${fill}:${kern}`
	let existing = byToken.get(cacheKey)
	if (existing) {
		return existing
	}

	let modifiers = [
		font({size: BADGE_POINT_SIZE, weight: 'bold', design: 'rounded'}),
		foregroundStyle('#FFFFFF'),
		kerning(kern),
		lineLimit(1),
		minimumScaleFactor(0.5),
		frame({width: BADGE_SIDE, height: BADGE_SIDE}),
		background(fill, shapes.circle()),
	]

	byToken.set(cacheKey, modifiers)
	return modifiers
}

/**
 * One of the cafe's dietary marks, drawn rather than downloaded.
 */
export function DietaryBadge({badge}: {badge: DietaryBadgeType}): React.ReactNode {
	return <Text modifiers={badgeModifiers(badge.fill, badge.kern)}>{badge.token}</Text>
}
