import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Button, Form, Host, HStack, Menu, Section, SwipeActions, Text} from '@expo/ui/swift-ui'
import {font, foregroundStyle, textSelection} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'

import {Tag} from '../../../source/components/rows'
import {SyncedTextField} from '../../../source/components/synced-text-field'
import {routeKey, useApiTestStore} from '../../../source/features/developer/api-test/store'
import {
	querySuggestions,
	recentRequests,
	type SavedRequest,
} from '../../../source/features/developer/api-test/util/history'
import {sendAfterConfirming} from '../../../source/features/developer/api-test/confirm-send'
import {methodColor} from '../../../source/features/developer/api-test/util/method'
import {missingInputs} from '../../../source/features/developer/api-test/util/inputs'
import {
	buildRequestPath,
	type QueryRow,
} from '../../../source/features/developer/api-test/util/request-path'

/** A query row as the form holds it, with an id that outlives edits to its name. */
type EditableRow = QueryRow & {id: number}

/// Row ids only need to be unique while the app runs, so one counter serves every screen.
let nextRowId = 0

function toRows(query: QueryRow[]): EditableRow[] {
	return query.map((row) => ({...row, id: nextRowId++}))
}

/** Fills a request in: the route's path and query values, ready to send. */
export default function APITestComposePage(): React.ReactNode {
	let router = useRouter()
	let {
		path = '',
		method = 'GET',
		params: paramList = '',
	} = useLocalSearchParams<{path?: string; method?: string; params?: string}>()
	let params = React.useMemo(() => paramList.split(',').filter(Boolean), [paramList])
	let route = routeKey(method, path)

	let history = useApiTestStore((state) => state.history)
	let record = useApiTestStore((state) => state.record)
	let remove = useApiTestStore((state) => state.remove)
	let clear = useApiTestStore((state) => state.clear)
	let recent = recentRequests(history, route)
	let suggestions = querySuggestions(history, route)

	// Starts from the last request sent to this route, so sending it again is
	// one tap.
	let [pathValues, setPathValues] = React.useState<Record<string, string>>(
		() => recent[0]?.pathValues ?? {},
	)
	let [rows, setRows] = React.useState<EditableRow[]>(() => toRows(recent[0]?.query ?? []))

	let fill = (request: SavedRequest) => {
		setPathValues(request.pathValues)
		setRows(toRows(request.query))
	}
	let updateRow = (id: number, change: Partial<QueryRow>) =>
		setRows((current) => current.map((row) => (row.id === id ? {...row, ...change} : row)))
	let addRow = (row: QueryRow) => setRows((current) => [...current, ...toRows([row])])
	let removeRow = (id: number) => setRows((current) => current.filter((row) => row.id !== id))

	let query = rows.map(({name, value}) => ({name, value}))
	let requestPath = buildRequestPath(path, pathValues, query)
	let missing = missingInputs(
		params.map((name) => ({name, in: 'path' as const, required: true})),
		{pathValues, query},
	)

	let send = () => {
		record(route, {pathValues, query})
		router.navigate({
			pathname: '/developer/api-test/detail',
			params: {path: requestPath, method, route: path},
		})
	}

	let confirmAndSend = () => sendAfterConfirming(method, requestPath, send)

	return (
		<>
			<Stack.Title>{path}</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu icon="ellipsis.circle">
					<Stack.Toolbar.MenuAction destructive={true} onPress={clear}>
						Forget All Saved Requests
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
				<Stack.Toolbar.Button
					accessibilityLabel={`Send ${method}`}
					disabled={missing.length > 0}
					icon="paperplane"
					onPress={confirmAndSend}
				/>
			</Stack.Toolbar>

			<Host style={styles.host}>
				<Form>
					<Section
						footer={
							missing.length ? <Text>{`Fill in ${missing.join(', ')} to send.`}</Text> : undefined
						}
						title="Request"
					>
						<HStack alignment="firstTextBaseline" spacing={8}>
							<Tag color={methodColor(method)} text={method} />
							<Text
								modifiers={[
									font({textStyle: 'footnote', design: 'monospaced'}),
									textSelection(true),
								]}
							>
								{requestPath}
							</Text>
						</HStack>
					</Section>

					{params.length ? (
						<Section title="Path Parameters">
							{params.map((name) => (
								<SyncedTextField
									autocapitalization="never"
									key={name}
									onChangeText={(value) =>
										setPathValues((current) => ({...current, [name]: value}))
									}
									placeholder={name}
									value={pathValues[name] ?? ''}
								/>
							))}
						</Section>
					) : null}

					<Section
						footer={rows.length ? <Text>Swipe a parameter to remove it.</Text> : undefined}
						title="Query"
					>
						{rows.map((row) => (
							<SwipeActions key={row.id}>
								<HStack spacing={8}>
									<SyncedTextField
										autocapitalization="never"
										onChangeText={(name) => updateRow(row.id, {name})}
										placeholder="name"
										value={row.name}
									/>
									<Text modifiers={[foregroundStyle(c.secondaryLabel)]}>=</Text>
									<SyncedTextField
										autocapitalization="never"
										onChangeText={(value) => updateRow(row.id, {value})}
										placeholder="value"
										value={row.value}
									/>
								</HStack>
								<SwipeActions.Actions allowsFullSwipe={true} edge="trailing">
									<Button
										label="Remove"
										onPress={() => removeRow(row.id)}
										role="destructive"
										systemImage="trash"
									/>
								</SwipeActions.Actions>
							</SwipeActions>
						))}
						{suggestions.length ? (
							<Menu label="Add Parameter" systemImage="plus.circle">
								{suggestions.map((suggestion) => (
									<Button
										key={suggestion.name}
										label={`${suggestion.name} = ${suggestion.value}`}
										onPress={() => addRow(suggestion)}
									/>
								))}
								<Button
									label="Custom…"
									onPress={() => addRow({name: '', value: ''})}
									systemImage="square.and.pencil"
								/>
							</Menu>
						) : (
							<Button
								label="Add Parameter"
								onPress={() => addRow({name: '', value: ''})}
								systemImage="plus.circle"
							/>
						)}
					</Section>

					{recent.length ? (
						<Section footer={<Text>Tap one to fill it back in.</Text>} title="Recent">
							{recent.map((request) => {
								let recentPath = buildRequestPath(path, request.pathValues, request.query)
								return (
									<SwipeActions key={recentPath}>
										<Button label={recentPath} onPress={() => fill(request)} />
										<SwipeActions.Actions allowsFullSwipe={true} edge="trailing">
											<Button
												label="Forget"
												onPress={() => remove(route, request)}
												role="destructive"
												systemImage="trash"
											/>
										</SwipeActions.Actions>
									</SwipeActions>
								)
							})}
						</Section>
					) : null}
				</Form>
			</Host>
		</>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
