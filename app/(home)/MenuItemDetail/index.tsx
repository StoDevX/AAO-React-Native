import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {MenuItemDetailView} from '../../../modules/food-menu/food-item-detail'
import {bonAppMenuItemOptions, pauseMenuItemOptions} from '../../../source/features/menus/query'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {OFFLINE_MESSAGE, menuView} from '../../../source/features/menus/lib/menu-view'

export default function MenuItemDetailPage(): React.ReactNode {
	let {source, cafe, cafeId, day, itemId} = useLocalSearchParams<{
		source: string
		/** A BonApp cafe's name, as the dining screens name theirs. */
		cafe?: string
		/** A BonApp cafe's id, as the BonApp Picker names its cafe. */
		cafeId?: string
		/** The day of the BonApp menu the item was listed on, as `YYYY-MM-DD`. */
		day?: string
		itemId: string
	}>()

	let bonAppQuery = useQuery({
		...bonAppMenuItemOptions(cafeId ? {id: cafeId} : (cafe ?? ''), day ?? '', itemId),
		enabled: source === 'bonapp',
	})

	let pauseQuery = useQuery({
		...pauseMenuItemOptions(itemId),
		enabled: source === 'pause',
	})

	let query = source === 'bonapp' ? bonAppQuery : pauseQuery
	let {refetch} = query
	let view = menuView(query)

	let screen = <Stack.Title>Nutrition</Stack.Title>

	// A source neither query knows leaves both disabled, and a disabled query
	// with no data stays pending for good, which would read as loading.
	if (source !== 'bonapp' && source !== 'pause') {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this menu item." />
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
				<NoticeView text={OFFLINE_MESSAGE} />
			</>
		)
	}

	if (view.kind === 'error') {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occurred while loading: ${view.error.message}`}
				/>
			</>
		)
	}

	let {data} = view
	if (!data.item) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this menu item." />
			</>
		)
	}

	// The dish carries the screen, so it takes the title. The generic
	// "Nutrition" above stands in only while there is no dish to name yet.
	return (
		<>
			<Stack.Screen options={{headerLargeTitleEnabled: true}} />
			<Stack.Title large={false}>{data.item.label}</Stack.Title>
			<MenuItemDetailView icons={data.icons} item={data.item} />
		</>
	)
}
