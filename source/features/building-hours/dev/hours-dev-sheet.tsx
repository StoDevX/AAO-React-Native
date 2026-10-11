import * as React from 'react'
import {StyleSheet} from 'react-native'
import {useQuery, useQueryClient} from '@tanstack/react-query'
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
import {clientFor} from '@frogpond/api'
import * as c from '@frogpond/colors'
import type {BreakCalendarResponse} from '@frogpond/schedules'
import {useNowOverride} from '@frogpond/timer'
import {timezone} from '@frogpond/constants'
import moment from 'moment-timezone'

import {campusById} from '../../../campuses'
import type {CampusId} from '../../../campuses/ids'
import {sectionServer} from '../../campus/section-server'
import {keys} from '../query'
import {TIME_JUMPS, type TimeJump} from './time-jumps'
import {breakJumps} from './break-jumps'
import {useForceBundledData} from './data-source-store'

type Props = {
	campus: CampusId
	isPresented: boolean
	onIsPresentedChange: (presented: boolean) => void
}

function isJumpSelected(jump: TimeJump, frozen: moment.Moment | null): boolean {
	if (!frozen) return false
	return frozen.isSame(jump.moment(), 'minute')
}

/**
 * Dev-only controls for the two things that make building hours hard to look
 * at: the clock, and where the data comes from. Moving the clock asks the
 * server for that day's hours, so jumping into a break shows its schedules.
 */
export function HoursDevSheet({campus, isPresented, onIsPresentedChange}: Props): React.ReactNode {
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
	// on its own when the source or the date changes underneath it.
	let refetch = () => queryClient.invalidateQueries({queryKey: keys.all(campus)})
	let toggleSource = (next: boolean) => {
		setForced(next)
		refetch()
	}
	let jumpTo = (m: moment.Moment) => {
		freeze(m)
		refetch()
	}
	let backToNow = () => {
		clear()
		refetch()
	}

	// Only a campus whose server keeps a break calendar has one; anything else
	// leaves the section out.
	let breaks = useQuery({
		queryKey: [campus, 'breaks'],
		queryFn: ({signal}) =>
			clientFor(sectionServer(campus, campusById(campus).hours))
				.get('breaks', {signal})
				.json<BreakCalendarResponse>(),
		enabled: isPresented,
		retry: false,
	})
	let jumpsToBreaks = breaks.data ? breakJumps(breaks.data) : []

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
							<Button onPress={backToNow}>
								<HStack>
									<Text>{frozen ? 'Back to now' : 'Using the real clock'}</Text>
									<Spacer />
									{!frozen ? <Image color="#007AFF" systemName="checkmark" /> : null}
								</HStack>
							</Button>
							{TIME_JUMPS.map((jump) => (
								<Button key={jump.label} onPress={() => jumpTo(jump.moment())}>
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
								onDateChange={(date) => jumpTo(moment.tz(date, timezone()))}
								selection={(frozen ?? moment.tz(timezone())).toDate()}
								title="Custom"
							/>
						</Section>

						{jumpsToBreaks.length > 0 ? (
							<Section title="Breaks">
								{jumpsToBreaks.map((jump) => (
									<Button key={jump.key} onPress={() => jumpTo(jump.moment())}>
										<HStack>
											<VStack alignment="leading">
												<Text>{jump.label}</Text>
												<Text modifiers={[font({size: 13}), foregroundStyle(c.secondaryLabel)]}>
													{jump.shows}
												</Text>
											</VStack>
											<Spacer />
											{frozen && jump.includes(frozen) ? (
												<Image color="#007AFF" systemName="checkmark" />
											) : null}
										</HStack>
									</Button>
								))}
							</Section>
						) : null}

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
