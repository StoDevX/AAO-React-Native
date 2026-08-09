import * as React from 'react'
import {useMomentTimer} from '@frogpond/timer'
import {BuildingDetail} from './building'
import {timezone} from '@frogpond/constants'
import {useRouter, type Href} from 'expo-router'
import type {BuildingType} from '../types'

type Props = {
	building: BuildingType
}

export function BuildingHoursDetailView({
	building: info,
}: Props): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})

	let reportProblem = React.useCallback(
		() =>
			// BuildingHoursProblemReport isn't wired into expo-router yet (deferred
			// to Task 2's Report/Editor redesign), so it's absent from the
			// generated route union and router.push() needs a cast to accept it.
			// Tapping this shows expo-router's built-in "Unmatched Route" screen
			// until Task 2 adds the real route.
			router.push({
				pathname: '/BuildingHoursProblemReport',
				params: {name: info.name},
			} as unknown as Href),
		[info.name, router],
	)

	return (
		<BuildingDetail info={info} now={now} onProblemReport={reportProblem} />
	)
}
