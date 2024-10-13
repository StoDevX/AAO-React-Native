import * as React from 'react'
import {BusLine} from './line'
import {LoadingView, NoticeView} from '../../../modules/notice'
import {timezone} from '../../../modules/constants'
import {useNavigation} from 'expo-router'
import {useBusRoutes} from './query'
import {useMomentTimer} from '../../../modules/timer'

interface Props {
	line: string
}

let BusView = (props: Props): React.JSX.Element => {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})
	let {data: busLines = [], error, refetch, isError, isLoading} = useBusRoutes()
	let navigation = useNavigation()

	let activeBusLine = busLines.find(({line}) => line === props.line)

	if (isLoading) {
		return <LoadingView />
	}

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${String(error)}`}
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
			// openMap={() => {
			// 	navigation.navigate('BusMapView', {line: activeBusLine})
			// }}
		/>
	)
}

export {BusView as View}
