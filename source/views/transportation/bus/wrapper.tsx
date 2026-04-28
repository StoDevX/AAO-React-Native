import * as React from 'react'
import {BusLine} from './line'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {timezone} from '@frogpond/constants'
import {useNavigation} from '@react-navigation/native'
import {useMomentTimer} from '@frogpond/timer'
import {busLinesCollection} from './collection'
import {queryClient} from '../../../init/tanstack-query'

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

	// Subscribe to data changes, collection status changes, and the query cache
	// so that all loading/error transitions trigger a re-render. The query cache
	// subscription catches background refetch errors that occur after the initial
	// load — collection status stays 'ready' in that case so status:change never
	// fires, but the QueryObserver state (isLoading, isError) still changes.
	let subscribe = React.useCallback((onStoreChange: () => void) => {
		let dataSub = busLinesCollection.subscribeChanges(() => {
			arrayRef.current = busLinesCollection.toArray
			utilsRef.current = getUtilsSnapshot()
			onStoreChange()
		})

		let statusUnsub = busLinesCollection.on('status:change', () => {
			utilsRef.current = getUtilsSnapshot()
			onStoreChange()
		})

		let cacheUnsub = queryClient.getQueryCache().subscribe(() => {
			utilsRef.current = getUtilsSnapshot()
			onStoreChange()
		})

		return () => {
			dataSub.unsubscribe()
			statusUnsub()
			cacheUnsub()
		}
	}, [])

	let lines = React.useSyncExternalStore(subscribe, () => arrayRef.current)

	let utils = React.useSyncExternalStore(subscribe, () => utilsRef.current)

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
