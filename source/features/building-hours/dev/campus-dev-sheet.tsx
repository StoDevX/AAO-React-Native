import * as React from 'react'
import {StyleSheet} from 'react-native'
import {useQueryClient} from '@tanstack/react-query'
import {
	BottomSheet,
	Button,
	DatePicker,
	Group,
	HStack,
	Host,
	Image,
	List,
	Section,
	Spacer,
	Text,
	Toggle,
	VStack,
} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	presentationDetents,
	presentationDragIndicator,
	scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {useNowOverride} from '@frogpond/timer'
import {timezone} from '@frogpond/constants'
import moment from 'moment-timezone'

import {keys} from '../query'
import {TIME_JUMPS, type TimeJump} from './time-jumps'
import {useForceBundledData} from './data-source-store'

type Props = {
	isPresented: boolean
	onIsPresentedChange: (presented: boolean) => void
}

function isJumpSelected(jump: TimeJump, frozen: moment.Moment | null): boolean {
	if (!frozen) return false
	return frozen.isSame(jump.moment(), 'minute')
}

/**
 * Dev-only controls for the two things that make building hours hard to look
 * at: the clock, and where the data comes from.
 */
export function CampusDevSheet({isPresented, onIsPresentedChange}: Props): React.ReactNode {
	let frozen = useNowOverride((state) => state.frozen)
	let freeze = useNowOverride((state) => state.freeze)
	let clear = useNowOverride((state) => state.clear)
	let forced = useForceBundledData((state) => state.forced)
	let setForced = useForceBundledData((state) => state.setForced)
	let queryClient = useQueryClient()

	let sheetModifiers = [
		presentationDetents([{fraction: 0.5}, {fraction: 0.75}, {fraction: 1.0}]),
		presentationDragIndicator('visible'),
	]

	// React Query has already cached the server's answer, so nothing refetches
	// on its own when the source changes underneath it.
	let toggleSource = (next: boolean) => {
		setForced(next)
		queryClient.invalidateQueries({queryKey: keys.all('stolaf')})
	}

	return (
		// `Host` wraps the sheet rather than sitting inside it: the sheet is itself
		// a SwiftUI view, and mounting one into a plain UIView throws "is being
		// mounted inside a standard UIView". `pointerEvents` keeps the full-bleed
		// host from swallowing taps on the list behind it; the sheet is presented
		// in its own window, so it stays interactive.
		<Host pointerEvents="none" style={StyleSheet.absoluteFill}>
			<BottomSheet isPresented={isPresented} onIsPresentedChange={onIsPresentedChange}>
				<Group modifiers={sheetModifiers}>
					<List modifiers={[scrollContentBackground('hidden')]}>
						<Section title="">
							<Button onPress={clear}>
								<HStack>
									<Text>{frozen ? 'Back to now' : 'Using the real clock'}</Text>
									<Spacer />
									{!frozen ? <Image color="#007AFF" systemName="checkmark" /> : null}
								</HStack>
							</Button>
							{TIME_JUMPS.map((jump) => (
								<Button key={jump.label} onPress={() => freeze(jump.moment())}>
									<HStack>
										<VStack alignment="leading">
											<Text>{jump.label}</Text>
											<Text modifiers={[font({size: 13}), foregroundStyle(c.secondaryLabel)]}>
												{jump.shows}
											</Text>
										</VStack>
										<Spacer />
										{isJumpSelected(jump, frozen) ? (
											<Image color="#007AFF" systemName="checkmark" />
										) : null}
									</HStack>
								</Button>
							))}
							<DatePicker
								displayedComponents={['date', 'hourAndMinute']}
								onDateChange={(date) => freeze(moment.tz(date, timezone()))}
								selection={(frozen ?? moment.tz(timezone())).toDate()}
								title="Custom"
							/>
						</Section>

						<Section title="">
							<Toggle
								isOn={forced}
								label="St. Olaf hours from this checkout"
								onIsOnChange={toggleSource}
							/>
						</Section>
					</List>
				</Group>
			</BottomSheet>
		</Host>
	)
}
