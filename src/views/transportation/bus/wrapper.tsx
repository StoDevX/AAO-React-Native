import * as React from 'react'
import {BusLine} from './line'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {timezone} from '@frogpond/constants'
import {useRouter} from 'expo-router'
import {useBusRoutes} from './query'
import {useMomentTimer} from '@frogpond/timer'

type Props = {
	line: string
}

export function BusView(props: Props): React.JSX.Element {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})
	let {data: busLines = [], error, refetch, isError, isLoading} = useBusRoutes()
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
			openMap={() => {
				if (activeBusLine) {
					router.push({
						pathname: '/transportation/bus-map',
						params: {line: JSON.stringify(activeBusLine)},
					})
				}
			}}
		/>
	)
}
