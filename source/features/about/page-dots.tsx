import * as React from 'react'
import {Circle, HStack} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityLabel,
	accessibilityValue,
	foregroundStyle,
	frame,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

/** UIPageControl's dot and the gap between dots. */
const DOT_SIZE = 7
const DOT_GAP = 8

/**
 * A page control's dots: one per page, the one showing drawn darker. Read as
 * one element, "Page, 2 of 3".
 */
export function PageDots({count, shown}: {count: number; shown: number}): React.ReactNode {
	return (
		<HStack
			modifiers={[
				frame({maxWidth: Infinity}),
				accessibilityElement('ignore'),
				accessibilityLabel('Page'),
				accessibilityValue(`${shown + 1} of ${count}`),
			]}
			spacing={DOT_GAP}
		>
			{Array.from({length: count}, (_, index) => (
				<Circle
					key={index}
					modifiers={[
						frame({width: DOT_SIZE, height: DOT_SIZE}),
						foregroundStyle(index === shown ? c.label : c.tertiaryLabel),
					]}
				/>
			))}
		</HStack>
	)
}
