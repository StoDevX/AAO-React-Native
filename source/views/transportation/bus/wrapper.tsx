import * as React from 'react'
import {BusLine} from './line'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {timezone} from '@frogpond/constants'
import {useNavigation} from '@react-navigation/native'
import {useBusRoutes} from './query'
import {useMomentTimer} from '@frogpond/timer'

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
				activeBusLine &&
					navigation.navigate('BusMapView', {line: activeBusLine})
			}}
		/>
	)
}

export {BusView as View}
