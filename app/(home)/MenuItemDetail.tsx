import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {MenuItemDetailView} from '../../modules/food-menu/food-item-detail'
import {
	bonAppMenuItemOptions,
	pauseMenuItemOptions,
} from '../../source/features/menus/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function MenuItemDetailPage(): React.ReactNode {
	let {source, cafe, itemId} = useLocalSearchParams<{
		source: string
		cafe?: string
		itemId: string
	}>()

	let bonAppQuery = useQuery({
		...bonAppMenuItemOptions(cafe ?? '', itemId),
		enabled: source === 'bonapp',
	})

	let pauseQuery = useQuery({
		...pauseMenuItemOptions(itemId),
		enabled: source === 'pause',
	})

	let {data, isLoading, error, refetch} =
		source === 'bonapp' ? bonAppQuery : pauseQuery

	let screen = <Stack.Title>Nutrition</Stack.Title>

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!data?.item) {
		return (
			<>
				{screen}
				<NoticeView text="Could not find this menu item." />
			</>
		)
	}

	return (
		<>
			{screen}
			<MenuItemDetailView icons={data.icons} item={data.item} />
		</>
	)
}
