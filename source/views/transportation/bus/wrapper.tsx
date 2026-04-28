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

type UtilsSnapshot = {
	isLoading: boolean
	isError: boolean
	lastError: unknown
	refetch: (typeof busLinesCollection.utils)['refetch']
}

function getUtilsSnapshot(): UtilsSnapshot {
	let {isLoading, isError, lastError, refetch} = busLinesCollection.utils
	return {isLoading, isError, lastError, refetch}
}

let BusView = (props: Props): React.ReactNode => {
	let {now} = useMomentTimer({intervalMs: 1000 * 60, timezone: timezone()})
	let navigation = useNavigation()

	// Cache the array to preserve reference stability between renders.
	// useSyncExternalStore requires getSnapshot to return the same reference
	// when the store has not changed.
	let arrayRef = React.useRef(busLinesCollection.toArray)

	// Cache the utils snapshot for the same reason.
	let utilsRef = React.useRef<UtilsSnapshot>(getUtilsSnapshot())

	// Subscribe to both data changes and collection status changes so that
	// loading → ready and loading → error transitions both trigger a re-render.
	let subscribe = React.useCallback((onStoreChange: () => void) => {
		let dataSub = busLinesCollection.subscribeChanges(() => {
			arrayRef.current = busLinesCollection.toArray
			onStoreChange()
		})

		let statusUnsub = busLinesCollection.on('status:change', () => {
			utilsRef.current = getUtilsSnapshot()
			onStoreChange()
		})

		return () => {
			dataSub.unsubscribe()
			statusUnsub()
		}
	}, [])

	let lines = React.useSyncExternalStore(
		subscribe,
		() => arrayRef.current,
	)

	let utils = React.useSyncExternalStore(
		subscribe,
		() => utilsRef.current,
	)

	let {isLoading, isError, lastError: error, refetch} = utils

	let activeBusLine = lines.find(({line}) => line === props.line)

	if (isLoading) {
		return <LoadingView />
	}

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={() => refetch()}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	if (!activeBusLine) {
		let lineNames = lines.map(({line}) => line).join(', ')
		let msg = `The line "${props.line}" was not found among ${lineNames}`
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
