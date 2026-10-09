import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {SheetCloseButton} from '../../source/components/sheet-close-button'
import {MenuItemDetailView} from '../../modules/food-menu/food-item-detail'
import {bonAppMenuItemOptions, pauseMenuItemOptions} from '../../source/features/menus/query'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import {OFFLINE_MESSAGE, menuView} from '../../source/features/menus/lib/menu-view'
import {campusFromParam} from '../../source/features/campus/campus-param'

export default function MenuItemDetailPage(): React.ReactNode {
	let {
		source,
		server: serverParam,
		cafe,
		cafeId,
		day,
		itemId,
	} = useLocalSearchParams<{
		source: string
		/** The menus server the café's menu came from, by campus id. */
		server?: string
		/** A BonApp cafe's name, as the dining screens name theirs. */
		cafe?: string
		/** A BonApp cafe's id, as the BonApp Picker names its cafe. */
		cafeId?: string
		/** The day of the BonApp menu the item was listed on, as `YYYY-MM-DD`. */
		day?: string
		itemId: string
	}>()
	// A link from before servers were named, or with an id this build lacks, reads the active campus's.
	let server = campusFromParam(serverParam)

	let bonAppQuery = useQuery({
		...bonAppMenuItemOptions(server, cafeId ? {id: cafeId} : (cafe ?? ''), day ?? '', itemId),
		enabled: source === 'bonapp',
	})

	let pauseQuery = useQuery({
		...pauseMenuItemOptions(server, itemId),
		enabled: source === 'pause',
	})

	let query = source === 'bonapp' ? bonAppQuery : pauseQuery
	let {refetch} = query
	let view = menuView(query)

	let screen = (
		<>
			<Stack.Title>Nutrition</Stack.Title>
			<SheetCloseButton />
		</>
	)

	// A source neither query knows leaves both disabled, and a disabled query
	// with no data stays pending for good, which would read as loading.
	if (source !== 'bonapp' && source !== 'pause') {
		return (
			<>
				{screen}
				<NoticeView systemImage="fork.knife" title="Menu Item Not Found" />
			</>
		)
	}

	if (view.kind === 'loading') {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (view.kind === 'offline') {
		return (
			<>
				{screen}
				<NoticeView description={OFFLINE_MESSAGE} systemImage="wifi.slash" title="Offline" />
			</>
		)
	}

	if (view.kind === 'error') {
		return (
			<>
				{screen}
				<LoadErrorView error={view.error} onRetry={refetch} />
			</>
		)
	}

	let {data} = view
	if (!data.item) {
		return (
			<>
				{screen}
				<NoticeView systemImage="fork.knife" title="Menu Item Not Found" />
			</>
		)
	}

	// The dish carries the screen, so it takes the title. The generic
	// "Nutrition" above stands in only while there is no dish to name yet.
	return (
		<>
			<Stack.Title>{data.item.label}</Stack.Title>
			<SheetCloseButton />
			<MenuItemDetailView icons={data.icons} item={data.item} />
		</>
	)
}
