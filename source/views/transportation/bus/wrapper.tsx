import * as React from 'react'
import {BusLine} from './line'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {timezone} from '@frogpond/constants'
import {useNavigation} from '@react-navigation/native'
import {useMomentTimer} from '@frogpond/timer'
import {busLinesCollection} from './collection'

type Props = {
	line: string
}

let BusView = (props: Props): React.ReactNode => {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})
	let navigation = useNavigation()

	// Subscribe to collection changes for reactivity
	let toArray = React.useSyncExternalStore(
		(onStoreChange) => {
			let sub = busLinesCollection.subscribeChanges(onStoreChange)
			return () => sub.unsubscribe()
		},
		() => busLinesCollection.toArray,
	)

	let {isLoading, isError, lastError, refetch} = busLinesCollection.utils

	let activeBusLine = toArray.find(({line}) => line === props.line)

	if (isLoading) {
		return <LoadingView />
	}

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={() => refetch()}
				text={`A problem occured while loading: ${lastError}`}
			/>
		)
	}

	if (!activeBusLine) {
		let lines = toArray.map(({line}) => line).join(', ')
		let msg = `The line "${props.line}" was not found among ${lines}`
		return <NoticeView text={msg} />
	}

	return (
		<BusLine
			line={activeBusLine}
			now={now}
			openMap={() => {
				if (activeBusLine) {
					navigation.navigate('BusMapView', {line: activeBusLine})
				}
			}}
		/>
	)
}

export {BusView as View}
