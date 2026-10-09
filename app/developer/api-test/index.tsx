import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import {Button, ContextMenu, Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {useQuery} from '@tanstack/react-query'
import {Stack, useRouter} from 'expo-router'
import {DisclosureRow} from '../../../source/components/rows'

import {SearchBar} from '../../../source/components/search-bar'
import {RouteEntry, serverRoutesOptions} from '../../../source/features/developer/api-test/query'
import {sendAfterConfirming} from '../../../source/features/developer/api-test/confirm-send'
import {inputSummary, nextStep} from '../../../source/features/developer/api-test/util/inputs'
import {methodColor} from '../../../source/features/developer/api-test/util/method'
import {routeParam} from '../../../source/features/developer/api-test/util/route-param'
import {useCampusId} from '../../../source/features/campus/store'

export default function APITestPage(): React.ReactNode {
	let router = useRouter()
	let campus = useCampusId()

	// The path is only read when the reader hits Search, but it has to be held
	// here as well: the search field is the one place it lives otherwise, and a
	// swipe back that is begun and abandoned empties it.
	let [path, setPath] = React.useState('')

	let {
		data: groupedRoutes = [],
		error: routesError,
		isLoading: isRoutesLoading,
		isError: isRoutesError,
		refetch: routesRefetch,
	} = useQuery(serverRoutesOptions(campus))

	const editRoute = React.useCallback(
		(route: RouteEntry) =>
			router.navigate({
				pathname: '/developer/api-test/compose',
				params: {path: routeParam(route.path), method: route.method},
			}),
		[router],
	)

	const openRoute = React.useCallback(
		(route: RouteEntry) => {
			// `sentAt` makes every send its own: an identical request already on
			// the stack would otherwise be shown again rather than sent
			let send = () =>
				router.navigate({
					pathname: '/developer/api-test/detail',
					params: {
						path: routeParam(route.path),
						method: route.method,
						route: routeParam(route.path),
						request: routeParam(JSON.stringify({pathValues: {}, query: []})),
						sentAt: String(Date.now()),
					},
				})
			if (nextStep(route) === 'form') {
				editRoute(route)
			} else {
				sendAfterConfirming(route.method, route.path, send)
			}
		},
		[router, editRoute],
	)

	return (
		<>
			<Stack.Title>API Tester</Stack.Title>

			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar
				autoCapitalize="none"
				onChangeText={setPath}
				onSearchButtonPress={(ev) => {
					router.navigate({
						pathname: '/developer/api-test/detail',
						params: {path: routeParam(ev.nativeEvent.text.trim())},
					})
				}}
				placeholder="/path/to/uri"
				value={path}
			/>

			<View style={styles.serverRouteContainer}>
				{isRoutesLoading ? (
					<LoadingView />
				) : isRoutesError && routesError instanceof Error ? (
					<LoadErrorView error={routesError} onRetry={routesRefetch} />
				) : !groupedRoutes ? (
					<NoticeView systemImage="questionmark.circle" title="No Routes" />
				) : (
					<Host style={styles.host}>
						<List
							modifiers={[
								listStyle('insetGrouped'),
								refreshable(async () => {
									await routesRefetch()
								}),
							]}
						>
							{groupedRoutes.map((section) => (
								<Section key={section.title} title={section.title}>
									{section.data.map((route) => (
										<ContextMenu key={route.key}>
											<ContextMenu.Trigger>
												<DisclosureRow
													detail={inputSummary(route.inputs)}
													onPress={() => openRoute(route)}
													tag={{text: route.method, color: methodColor(route.method)}}
													title={route.displayName}
												/>
											</ContextMenu.Trigger>
											<ContextMenu.Items>
												<Button
													label="Edit Request…"
													onPress={() => editRoute(route)}
													systemImage="pencil"
												/>
											</ContextMenu.Items>
										</ContextMenu>
									))}
								</Section>
							))}
						</List>
					</Host>
				)}
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	serverRouteContainer: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
