import * as React from 'react'
import type {UnprocessedBusLine} from './types'
import {BusLine} from './line'
import {Timer} from '@frogpond/timer'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'
import {timezone} from '@frogpond/constants'
import {useNavigation} from '@react-navigation/native'

const fetchBusTimes = (): Promise<Array<UnprocessedBusLine>> =>
	fetch(API('/transit/bus'))
		.json<{data: Array<UnprocessedBusLine>}>()
		.then((body) => body.data)

type Props = {
	line: string
}

let BusView = (props: Props): JSX.Element => {
	let [busLines, setBusLines] = React.useState<Array<UnprocessedBusLine>>([])
	let [activeBusLine, setActiveBusLine] =
		React.useState<UnprocessedBusLine | null>()
	let [loading, setLoading] = React.useState(true)

	let navigation = useNavigation()

	let fetchData = React.useCallback(async () => {
		let busLines = await fetchBusTimes()
		let activeBusLine = busLines.find(({line}) => line === props.line)

		setBusLines(busLines)
		setActiveBusLine(activeBusLine)
	}, [props.line])

	React.useEffect(() => {
		fetchData()
		setLoading(false)
	}, [fetchData])

	let openMap = () => {
		activeBusLine && navigation.navigate('BusMapView', {line: activeBusLine})
	}

	if (loading) {
		return <LoadingView />
	}

	return (
		<Timer
			interval={60000}
			moment={true}
			render={({now}) => {
				if (!activeBusLine) {
					let lines = busLines.map(({line}) => line).join(', ')
					let msg = `The line "${props.line}" was not found among ${lines}`
					return <NoticeView text={msg} />
				}
				return <BusLine line={activeBusLine} now={now} openMap={openMap} />
			}}
			timezone={timezone()}
		/>
	)
}

export {BusView as View}
