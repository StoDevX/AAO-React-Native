import * as React from 'react'
import {Linking} from 'react-native'
import {Button, HStack, Image, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonBorderShape,
	buttonStyle,
	font,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'

import {FILL_WIDTH} from '../../../components/tile-layout'
import type {CardAction} from '../lib/card-actions'
import {CARD_INSET} from './card-style'

/// Maps' action buttons are 53pt tall with 12pt corners; the label's height
/// plus the bordered style's own padding comes to that.
const LABEL_HEIGHT = 37
const CORNER_RADIUS = 12

/// Maps sets the row 20pt under the title, on the sheet.
const ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 20, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

const LOOK: Record<CardAction['kind'], {title: string; symbol: 'car.fill'}> = {
	directions: {title: 'Directions', symbol: 'car.fill'},
}

/// Maps' row of big buttons under a place's title: Directions filled, the rest
/// tinted, sharing the row's width equally, so one button fills it.
export function ActionsRow({actions}: {actions: Array<CardAction>}): React.ReactNode {
	if (actions.length === 0) {
		return null
	}
	return (
		<Section>
			<HStack modifiers={ROW} spacing={8}>
				{actions.map((action, index) => {
					let {title, symbol} = LOOK[action.kind]
					return (
						<Button
							key={action.kind}
							modifiers={[
								buttonStyle(index === 0 ? 'borderedProminent' : 'bordered'),
								buttonBorderShape('roundedRectangle', CORNER_RADIUS),
								accessibilityLabel(title),
								accessibilityIdentifier(`card-action-${action.kind}`),
							]}
							onPress={() => {
								Linking.openURL(action.url).catch((err: unknown) => {
									console.warn(`could not open ${action.url}`, err)
								})
							}}
						>
							<VStack
								modifiers={[frame({maxWidth: FILL_WIDTH, minHeight: LABEL_HEIGHT})]}
								spacing={2}
							>
								<Image modifiers={[font({textStyle: 'title3'})]} systemName={symbol} />
								<Text modifiers={[font({textStyle: 'subheadline', weight: 'semibold'})]}>
									{title}
								</Text>
							</VStack>
						</Button>
					)
				})}
			</HStack>
		</Section>
	)
}
