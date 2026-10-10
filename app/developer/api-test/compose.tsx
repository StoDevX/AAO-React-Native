import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Button,
	Form,
	Host,
	HStack,
	Image,
	Menu,
	Section,
	SwipeActions,
	Text,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	font,
	foregroundStyle,
	imageScale,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'

import {useCampusId} from '../../../source/features/campus/store'
import {Tag} from '../../../source/components/rows'
import {SyncedTextField} from '../../../source/components/synced-text-field'
import {sendAfterConfirming} from '../../../source/features/developer/api-test/confirm-send'
import {
	historyKey,
	routeKey,
	useApiTestStore,
} from '../../../source/features/developer/api-test/store'
import {
	querySuggestions,
	recentRequests,
	type SavedRequest,
} from '../../../source/features/developer/api-test/util/history'
import {
	bodyProblem,
	initialValues,
	missingInputs,
	startingRequest,
	suggestionsFor,
} from '../../../source/features/developer/api-test/util/inputs'
import {carriesBody, methodColor} from '../../../source/features/developer/api-test/util/method'
import {routeParam} from '../../../source/features/developer/api-test/util/route-param'
import {
	buildRequestPath,
	pathParams,
	requestLabel,
	type QueryRow,
} from '../../../source/features/developer/api-test/util/request-path'

/** A query row as the form holds it, with an id that outlives edits to its name. */
type EditableRow = QueryRow & {id: number}

/// Row ids only need to be unique while the app runs, so one counter serves every screen.
let nextRowId = 0

function toRows(query: QueryRow[]): EditableRow[] {
	return query.map((row) => ({...row, id: nextRowId++}))
}

const MONOSPACED = font({textStyle: 'footnote', design: 'monospaced'})

/** A stamp new with each send, so the result screen treats each as its own request. */
function sendStamp(): string {
	return String(Date.now())
}

/** A value's earlier entries, in a menu beside it; nothing when there are none. */
function Suggestions(props: {
	name: string
	suggestions: string[]
	onChange: (value: string) => void
}): React.ReactNode {
	let {name, suggestions, onChange} = props
	if (!suggestions.length) {
		return null
	}
	return (
		<Menu
			label={
				// sized to sit beside the value like a picker's own chevrons, not over it
				<Image
					modifiers={[font({textStyle: 'footnote', weight: 'semibold'}), imageScale('small')]}
					systemName="chevron.down"
				/>
			}
			modifiers={[accessibilityLabel(`Suggestions for ${name}`)]}
		>
			{suggestions.map((suggestion) => (
				<Button key={suggestion} label={suggestion} onPress={() => onChange(suggestion)} />
			))}
		</Menu>
	)
}

/** Fills a request in: the route's path params, query values and body, ready to send. */
export default function APITestComposePage(): React.ReactNode {
	let router = useRouter()
	let {
		path = '',
		method = 'GET',
		request: sent,
	} = useLocalSearchParams<{path?: string; method?: string; request?: string}>()
	let params = React.useMemo(() => pathParams(path), [path])
	let campus = useCampusId()
	let remembered = historyKey(campus, routeKey(method, path))
	let hasBody = carriesBody(method)

	let history = useApiTestStore((state) => state.history)
	let record = useApiTestStore((state) => state.record)
	let remove = useApiTestStore((state) => state.remove)
	let clear = useApiTestStore((state) => state.clear)
	let recent = recentRequests(history, remembered)
	let usedBefore = querySuggestions(history, remembered)

	// Starts from the request just sent, or the last one remembered, so
	// sending it again is one tap.
	let [initial] = React.useState(() => initialValues(params, startingRequest(sent, recent)))
	let [pathValues, setPathValues] = React.useState(initial.pathValues)
	let [body, setBody] = React.useState(initial.body ?? '')
	let [rows, setRows] = React.useState(() => toRows(initial.query))

	let fill = (request: SavedRequest) => {
		let next = initialValues(params, request)
		setPathValues(next.pathValues)
		setBody(next.body ?? '')
		setRows(toRows(next.query))
	}
	let updateRow = (id: number, change: Partial<QueryRow>) =>
		setRows((current) => current.map((row) => (row.id === id ? {...row, ...change} : row)))
	let addRow = (row: QueryRow) => setRows((current) => [...current, ...toRows([row])])
	let removeRow = (id: number) => setRows((current) => current.filter((row) => row.id !== id))

	let query = rows.map(({name, value}) => ({name, value}))
	let requestPath = buildRequestPath(path, pathValues, query)
	let missing = missingInputs(params, {pathValues, query})
	let sentBody = hasBody && body.trim() ? body : undefined
	let problem = hasBody ? bodyProblem(body) : undefined

	let send = () => {
		let request = {pathValues, query, ...(sentBody ? {body: sentBody} : {})}
		record(remembered, request)
		// `sentAt` makes every send its own: an identical request already on the
		// stack would otherwise be shown again rather than sent
		router.navigate({
			pathname: '/developer/api-test/detail',
			params: {
				path: routeParam(requestPath),
				method,
				route: routeParam(path),
				request: routeParam(JSON.stringify(request)),
				sentAt: sendStamp(),
			},
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
					disabled={missing.length > 0 || problem !== undefined}
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
							<Text modifiers={[MONOSPACED, textSelection(true)]}>{requestPath}</Text>
						</HStack>
					</Section>

					{params.length ? (
						<Section title="Path Parameters">
							{params.map((name) => (
								<HStack key={name} spacing={8}>
									<Text>{name}</Text>
									<SyncedTextField
										alignment="trailing"
										autocapitalization="never"
										onChangeText={(value) =>
											setPathValues((current) => ({...current, [name]: value}))
										}
										placeholder={name}
										value={pathValues[name] ?? ''}
									/>
									<Suggestions
										name={name}
										onChange={(value) => setPathValues((current) => ({...current, [name]: value}))}
										suggestions={suggestionsFor(name, history, remembered)}
									/>
								</HStack>
							))}
						</Section>
					) : null}

					{hasBody ? (
						<Section footer={<Text>{problem ?? 'Sent as JSON.'}</Text>} title="Body (JSON)">
							<SyncedTextField
								autocapitalization="never"
								multiline={true}
								onChangeText={setBody}
								placeholder='{"text": "<b>hi</b>"}'
								value={body}
							/>
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
						{/* A menu holding only Custom… would be a tap for nothing: with no
						    other choice, the button adds a row to fill in straight away. */}
						{usedBefore.length ? (
							<Menu label="Add Parameter" systemImage="plus.circle">
								<Section title="Used before">
									{usedBefore.map((suggestion) => (
										<Button
											key={suggestion.name}
											label={`${suggestion.name} = ${suggestion.value}`}
											onPress={() => addRow(suggestion)}
										/>
									))}
								</Section>
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
								let label = requestLabel(path, request)
								return (
									<SwipeActions key={label}>
										<Button label={label} onPress={() => fill(request)} />
										<SwipeActions.Actions allowsFullSwipe={true} edge="trailing">
											<Button
												label="Forget"
												onPress={() => remove(remembered, request)}
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
