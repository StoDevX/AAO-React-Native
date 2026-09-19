import * as React from 'react'
import {useRouter} from 'expo-router'
import {BusLine} from './line'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {timezone} from '@frogpond/constants'
import {busRoutesOptions} from './query'
import {useBusDay} from './store'
import {useQuery} from '@tanstack/react-query'
import {useMomentTimer} from '@frogpond/timer'

type Props = {
	line: string
}

let BusView = (props: Props): React.ReactNode => {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})
	let {data: busLines = [], error, refetch, isError, isLoading} = useQuery(busRoutesOptions)
	let {selectedDay} = useBusDay()
	let router = useRouter()

	let activeBusLine = busLines.find(({line}) => line === props.line)

	if (isLoading) {
		return <LoadingView />
	}

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	if (!activeBusLine) {
		let lines = busLines.map(({line}) => line).join(', ')
		let msg = `The line "${props.line}" was not found among ${lines}`
		return <NoticeView text={msg} />
	}

	return (
		<BusLine
			line={activeBusLine}
			now={now}
			onPressStop={(stopName) => {
				router.push({
					pathname: '/Transportation/line/stop',
					params: {line: props.line, day: selectedDay ?? '', stopName},
				})
			}}
			selectedDay={selectedDay}
		/>
	)
}

export {BusView as View}
