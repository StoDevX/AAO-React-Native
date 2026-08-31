import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'

import {BADGE_POINT_SIZE, BADGE_SIDE, type DietaryBadgeType} from './lib/dietary-badge'

/**
 * The React Native twin of `DietaryBadge`, for the filter popover -- a
 * `react-native-popover-view` modal, where a SwiftUI `Host` mounts but does not
 * paint until something forces a second layout pass.
 *
 * Both renderers take their token, colour, kerning and geometry from
 * `lib/dietary-badge`, so the two marks cannot drift apart; only the drawing
 * differs. Delete this once the filter popovers are SwiftUI themselves, and the
 * row's own badge will serve both.
 */
export function DietaryBadgeRN({badge}: {badge: DietaryBadgeType}): React.ReactNode {
	return (
		<View style={[styles.badge, {backgroundColor: badge.fill}]}>
			<Text
				// Mirrors `minimumScaleFactor` on the SwiftUI side: a two-character
				// token shrinks to fit rather than overflowing the disc.
				adjustsFontSizeToFit={true}
				minimumFontScale={0.5}
				numberOfLines={1}
				style={[styles.token, {letterSpacing: badge.kern}]}
			>
				{badge.token}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	badge: {
		width: BADGE_SIDE,
		height: BADGE_SIDE,
		borderRadius: BADGE_SIDE / 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	token: {
		color: c.white,
		fontSize: BADGE_POINT_SIZE,
		fontWeight: '700',
	},
})
