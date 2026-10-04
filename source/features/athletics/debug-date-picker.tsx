import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack} from 'expo-router'

import {
	BottomSheet,
	Button,
	DatePicker,
	Group,
	Host,
	HStack,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	buttonStyle,
	datePickerStyle,
	font,
	frame,
	padding,
	presentationDetents,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers'

import {useIsDevMode} from '../../lib/use-is-dev-mode'

type Props = {
	value: Date
	onDateChange: (date: Date) => void
	/** Puts the list back on the real today. */
	onReset: () => void
}

/**
 * Moves the day the list treats as today, so it can be read against a date
 * that has fixtures in it rather than whichever day the season happens to be
 * on. Dev mode only.
 *
 * A toolbar button presenting a sheet, because a header toolbar takes only
 * buttons and menus: `Stack.Toolbar.View`, which could hold the picker itself,
 * throws outright for `left` and `right`.
 */
export function DebugDatePicker({value, onDateChange, onReset}: Props): React.ReactNode {
	let isDevMode = useIsDevMode()
	let [isPresented, setIsPresented] = React.useState(false)

	if (!isDevMode) {
		return null
	}

	return (
		<>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Debug Date"
					icon="calendar"
					onPress={() => setIsPresented(true)}
				/>
			</Stack.Toolbar>
			<Host pointerEvents="none" style={styles.host}>
				<BottomSheet isPresented={isPresented} onIsPresentedChange={setIsPresented}>
					<Group
						modifiers={[presentationDetents(['medium']), presentationDragIndicator('visible')]}
					>
						<VStack modifiers={[padding({horizontal: 16, top: 20})]} spacing={8}>
							<HStack>
								<Text modifiers={[font({textStyle: 'title3', weight: 'semibold'})]}>
									Debug Date
								</Text>
								<Spacer />
								<Button
									label="Today"
									modifiers={[buttonStyle('borderless'), frame({minHeight: 44})]}
									onPress={onReset}
								/>
							</HStack>
							<DatePicker
								displayedComponents={['date']}
								modifiers={[datePickerStyle('graphical')]}
								onDateChange={onDateChange}
								selection={value}
								title="Debug date"
							/>
						</VStack>
					</Group>
				</BottomSheet>
			</Host>
		</>
	)
}

const styles = StyleSheet.create({
	// Nothing to see or touch until the sheet is presented.
	host: {position: 'absolute', width: 0, height: 0},
})
