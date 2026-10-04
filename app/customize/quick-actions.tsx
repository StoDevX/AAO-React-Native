import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Button, Form, HStack, Host, Image, Spacer, Text} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	disabled,
	foregroundStyle,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'

import {ActionRow, LeadingImage} from '../../source/components/rows'
import {
	quickActionDestinations,
	resolveQuickActions,
} from '../../source/features/quick-actions/destinations'
import type {QuickActionDestination} from '../../source/features/quick-actions/destinations'
import {isPickable} from '../../source/features/quick-actions/picker'
import {useQuickActionsStore} from '../../source/features/quick-actions/store'
import {iconImage} from '../../source/features/views'

const styles = StyleSheet.create({
	// Pushed inside the Customize sheet, which paints no background of its own.
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

/// Wide enough for the widest symbol, so every title starts at one edge.
const SYMBOL_COLUMN = 28

export default function QuickActionsPage(): React.ReactNode {
	let saved = useQuickActionsStore((state) => state.quickActions)
	let toggle = useQuickActionsStore((state) => state.toggleQuickAction)
	let reset = useQuickActionsStore((state) => state.resetQuickActions)

	// Resolved here rather than in a store selector: a selector returning a
	// fresh array re-renders forever under zustand 5.
	let picked = React.useMemo(() => resolveQuickActions(saved).map((d) => d.id), [saved])
	let destinations = React.useMemo(() => quickActionDestinations(), [])

	return (
		<>
			<Stack.Title>Quick Actions</Stack.Title>
			<Host style={styles.host} modifiers={[accessibilityIdentifier('screen-quick-actions')]}>
				<Form>
					<SheetSection
						footer={<Text>Long-press the app icon to open these. Choose up to 4.</Text>}
					>
						{destinations.map((destination) => (
							<DestinationRow
								key={destination.id}
								destination={destination}
								isPicked={picked.includes(destination.id)}
								isPickable={isPickable(destination.id, picked)}
								onToggle={toggle}
							/>
						))}
					</SheetSection>
					<SheetSection>
						<ActionRow onPress={reset} title="Reset to Defaults" />
					</SheetSection>
				</Form>
			</Host>
		</>
	)
}

type DestinationRowProps = {
	destination: QuickActionDestination
	isPicked: boolean
	isPickable: boolean
	onToggle: (id: string) => void
}

const DestinationRow = React.memo(function DestinationRow(
	props: DestinationRowProps,
): React.ReactNode {
	let {destination, isPicked, isPickable: canToggle, onToggle} = props

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(destination.title),
				disabled(!canToggle),
				...(isPicked ? [accessibilityAddTraits(['isSelected'])] : []),
			]}
			onPress={() => onToggle(destination.id)}
		>
			{/* contentShape on the label, not the Button, so the whole row is
			    tappable -- see NavigationRow. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]}>
				<LeadingImage image={{...iconImage(destination.icon), width: SYMBOL_COLUMN}} />
				<Text modifiers={[foregroundStyle(canToggle ? c.label : c.secondaryLabel)]}>
					{destination.title}
				</Text>
				<Spacer />
				{isPicked && <Image color={c.systemBlue} size={16} systemName="checkmark" />}
			</HStack>
		</Button>
	)
})
