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
	Spacer,
	SwipeActions,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	font,
	foregroundStyle,
	imageScale,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {useQuery} from '@tanstack/react-query'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'

import {MenuPickerRow} from '../../../source/components/menu-picker-row'
import {useCampusId} from '../../../source/features/campus/store'
import {Tag} from '../../../source/components/rows'
import {SyncedTextField} from '../../../source/components/synced-text-field'
import {sendAfterConfirming} from '../../../source/features/developer/api-test/confirm-send'
import {
	serverRoutesOptions,
	type RouteInput,
} from '../../../source/features/developer/api-test/query'
import {routeKey, useApiTestStore} from '../../../source/features/developer/api-test/store'
import {
	querySuggestions,
	recentRequests,
	type SavedRequest,
} from '../../../source/features/developer/api-test/util/history'
import {
	defaultFor,
	initialValues,
	missingInputs,
	requestBody,
	startingRequest,
	suggestionsFor,
} from '../../../source/features/developer/api-test/util/inputs'
import {methodColor} from '../../../source/features/developer/api-test/util/method'
import {routeParam} from '../../../source/features/developer/api-test/util/route-param'
import {
	buildRequestPath,
	requestLabel,
	type QueryRow,
} from '../../../source/features/developer/api-test/util/request-path'

/** A query row as the form holds it. A row for a declared input carries it, which fixes its name. */
type EditableRow = QueryRow & {id: number; input?: RouteInput}

/// Row ids only need to be unique while the app runs, so one counter serves every screen.
let nextRowId = 0

function toRows(query: QueryRow[], inputs: RouteInput[]): EditableRow[] {
	return query.map((row) => ({
		...row,
		id: nextRowId++,
		input: inputs.find((input) => input.in === 'query' && input.name === row.name),
	}))
}

/** An input's suggested values, in a menu beside it; nothing when there are none. */
function Suggestions(props: {
	input: RouteInput
	suggestions: string[]
	onChange: (value: string) => void
}): React.ReactNode {
	let {input, suggestions, onChange} = props
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
			modifiers={[accessibilityLabel(`Suggestions for ${input.name}`)]}
		>
			{suggestions.map((suggestion) => (
				<Button key={suggestion} label={suggestion} onPress={() => onChange(suggestion)} />
			))}
		</Menu>
	)
}

/**
 * An input's row: a picker for a set of accepted values; for a body field, its
 * name over a field that grows with what is typed; else its name with the
 * value beside it, trailing. Suggestions sit in a menu beside the name.
 */
function InputValue(props: {
	input: RouteInput
	value: string
	suggestions: string[]
	onChange: (value: string) => void
}): React.ReactNode {
	let {input, value, suggestions, onChange} = props
	if (input.in === 'body') {
		return (
			<VStack alignment="leading" spacing={6}>
				<HStack>
					<Text>{input.name}</Text>
					<Spacer />
					<Suggestions input={input} onChange={onChange} suggestions={suggestions} />
				</HStack>
				<SyncedTextField
					autocapitalization="never"
					multiline={true}
					onChangeText={onChange}
					placeholder={input.name}
					value={value}
				/>
			</VStack>
		)
	}
	if (input.values) {
		return (
			<MenuPickerRow
				id={`api-test-input-${input.name}`}
				label={input.name}
				onSelectionChange={onChange}
				options={input.values.map(
					(option) =>
						[
							option.value,
							option.label ? `${option.value} — ${option.label}` : option.value,
						] as const,
				)}
				selection={value}
			/>
		)
	}
	return (
		<HStack spacing={8}>
			<Text>{input.name}</Text>
			<SyncedTextField
				alignment="trailing"
				autocapitalization="never"
				keyboardType={input.format === 'integer' ? 'numeric' : undefined}
				onChangeText={onChange}
				placeholder={input.format === 'date' ? 'YYYY-MM-DD' : input.name}
				value={value}
			/>
			<Suggestions input={input} onChange={onChange} suggestions={suggestions} />
		</HStack>
	)
}

/** Fills a request in: the route's path and query values, ready to send. */
export default function APITestComposePage(): React.ReactNode {
	let router = useRouter()
	let {
		path = '',
		method = 'GET',
		request: sent,
	} = useLocalSearchParams<{path?: string; method?: string; request?: string}>()
	let route = routeKey(method, path)

	let campus = useCampusId()
	let {data: sections = []} = useQuery(serverRoutesOptions(campus))
	let inputs = React.useMemo(
		() =>
			sections.flatMap((section) => section.data).find((entry) => entry.key === route)?.inputs ??
			[],
		[sections, route],
	)
	let pathInputs = inputs.filter((input) => input.in === 'path')
	let queryInputs = inputs.filter((input) => input.in === 'query')
	let bodyInputs = inputs.filter((input) => input.in === 'body')

	let history = useApiTestStore((state) => state.history)
	let record = useApiTestStore((state) => state.record)
	let remove = useApiTestStore((state) => state.remove)
	let clear = useApiTestStore((state) => state.clear)
	let recent = recentRequests(history, route)
	let suggestions = querySuggestions(history, route)

	// Starts from the last request sent to this route, so sending it again is
	// one tap; or, for a route never sent, from values the server accepts.
	let [initial] = React.useState(() => initialValues(inputs, startingRequest(sent, recent)))
	let [pathValues, setPathValues] = React.useState(initial.pathValues)
	let [bodyValues, setBodyValues] = React.useState(initial.bodyValues)
	let [rows, setRows] = React.useState(() => toRows(initial.query, inputs))
	let touched = React.useRef(false)

	let fill = (request: SavedRequest) => {
		let next = initialValues(inputs, request)
		setPathValues(next.pathValues)
		setBodyValues(next.bodyValues)
		setRows(toRows(next.query, inputs))
	}

	// Opened cold, as from a link, the form renders before the sitemap arrives;
	// it fills itself in once, when the route's inputs are known, unless the
	// reader has already started typing.
	let filledFromInputs = React.useRef(inputs.length > 0)
	React.useEffect(() => {
		if (inputs.length && !filledFromInputs.current && !touched.current) {
			filledFromInputs.current = true
			fill(startingRequest(sent, recent) ?? {pathValues: {}, query: []})
		}
		// Only the arrival of the inputs should trigger this; `fill` and `recent`
		// are read as they are at that moment.
		// oxlint-disable-next-line react/exhaustive-deps
	}, [inputs])

	let setBodyValue = (name: string, value: string) => {
		touched.current = true
		setBodyValues((current) => ({...current, [name]: value}))
	}
	let setPathValue = (name: string, value: string) => {
		touched.current = true
		setPathValues((current) => ({...current, [name]: value}))
	}
	let updateRow = (id: number, change: Partial<QueryRow>) => {
		touched.current = true
		setRows((current) => current.map((row) => (row.id === id ? {...row, ...change} : row)))
	}
	let addRow = (row: QueryRow) => {
		touched.current = true
		setRows((current) => [...current, ...toRows([row], inputs)])
	}
	let removeRow = (id: number) => {
		touched.current = true
		setRows((current) => current.filter((row) => row.id !== id))
	}

	let query = rows.map(({name, value}) => ({name, value}))
	let requestPath = buildRequestPath(path, pathValues, query)
	let missing = missingInputs(inputs, {pathValues, query, bodyValues})
	let body = requestBody(inputs, bodyValues)
	let today = new Date()

	let addedNames = new Set(rows.map((row) => row.name))
	let accepted = queryInputs.filter((input) => !input.required && !addedNames.has(input.name))
	let usedBefore = suggestions.filter(
		(suggestion) => !queryInputs.some((input) => input.name === suggestion.name),
	)

	let send = () => {
		record(route, {pathValues, query, bodyValues: body})
		// `sentAt` makes every send its own: an identical request already on the
		// stack would otherwise be shown again rather than sent
		router.navigate({
			pathname: '/developer/api-test/detail',
			params: {
				path: routeParam(requestPath),
				method,
				route: routeParam(path),
				request: routeParam(JSON.stringify({pathValues, query, bodyValues: body})),
				sentAt: String(Date.now()),
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
						{body ? (
							<Text
								modifiers={[
									font({textStyle: 'footnote', design: 'monospaced'}),
									foregroundStyle(c.secondaryLabel),
									textSelection(true),
								]}
							>
								{JSON.stringify(body, null, 2)}
							</Text>
						) : null}
					</Section>

					{pathInputs.length ? (
						<Section title="Path Parameters">
							{pathInputs.map((input) => (
								<InputValue
									input={input}
									key={input.name}
									onChange={(value) => setPathValue(input.name, value)}
									suggestions={suggestionsFor(input, history, route, today)}
									value={pathValues[input.name] ?? ''}
								/>
							))}
						</Section>
					) : null}

					{bodyInputs.length ? (
						<Section footer={<Text>Sent as JSON.</Text>} title="Body">
							{bodyInputs.map((input) => (
								<InputValue
									input={input}
									key={input.name}
									onChange={(value) => setBodyValue(input.name, value)}
									suggestions={suggestionsFor(input, history, route, today)}
									value={bodyValues?.[input.name] ?? ''}
								/>
							))}
						</Section>
					) : null}

					<Section
						footer={rows.length ? <Text>Swipe a parameter to remove it.</Text> : undefined}
						title="Query"
					>
						{rows.map((row) => {
							let control = row.input ? (
								<InputValue
									input={row.input}
									onChange={(value) => updateRow(row.id, {value})}
									suggestions={
										row.input.values ? [] : suggestionsFor(row.input, history, route, today)
									}
									value={row.value}
								/>
							) : (
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
							)
							// A required input stays: the request cannot go without it.
							if (row.input?.required) {
								return <React.Fragment key={row.id}>{control}</React.Fragment>
							}
							return (
								<SwipeActions key={row.id}>
									{control}
									<SwipeActions.Actions allowsFullSwipe={true} edge="trailing">
										<Button
											label="Remove"
											onPress={() => removeRow(row.id)}
											role="destructive"
											systemImage="trash"
										/>
									</SwipeActions.Actions>
								</SwipeActions>
							)
						})}
						{/* A menu holding only Custom… would be a tap for nothing: with no
						    other choice, the button adds a row to fill in straight away. */}
						{accepted.length || usedBefore.length ? (
							<Menu label="Add Parameter" systemImage="plus.circle">
								{accepted.length ? (
									<Section title="Accepted by this route">
										{accepted.map((input) => (
											<Button
												key={input.name}
												label={input.name}
												onPress={() => addRow({name: input.name, value: defaultFor(input)})}
											/>
										))}
									</Section>
								) : null}
								{usedBefore.length ? (
									<Section title="Used before">
										{usedBefore.map((suggestion) => (
											<Button
												key={suggestion.name}
												label={`${suggestion.name} = ${suggestion.value}`}
												onPress={() => addRow(suggestion)}
											/>
										))}
									</Section>
								) : null}
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
								let recentPath = requestLabel(path, request)
								return (
									<SwipeActions key={recentPath}>
										<Button
											label={recentPath}
											onPress={() => {
												touched.current = true
												fill(request)
											}}
										/>
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
