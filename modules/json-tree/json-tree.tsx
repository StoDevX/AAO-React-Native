import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {ColorValue} from 'react-native'
import {Button, DisclosureGroup, Host, HStack, List, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle, frame, listStyle, textSelection} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {
	isContainer,
	jsonEntries,
	jsonLeaf,
	jsonSummary,
	stacksValue,
	startsOpen,
	type JsonEntry,
} from './tree'

/// How many of an object's or array's entries show before a "show more" row,
/// so opening a long array does not build every row at once.
const PAGE = 100

/**
 * The last Expand All or Collapse All, for every group in a tree to follow.
 * `count` goes up with each one, so pressing the same one twice still acts.
 */
export type ExpandCommand = {mode: 'all' | 'none' | null; count: number}

const ExpandContext = React.createContext<ExpandCommand>({mode: null, count: 0})

/// A colour for each kind of value, as JSON syntax highlighting usually colours them.
const LEAF_COLORS: Record<ReturnType<typeof jsonLeaf>['kind'], ColorValue> = {
	string: c.systemGreen,
	number: c.systemOrange,
	boolean: c.systemRed,
	null: c.systemPurple,
}

/// SF Mono reads larger than SF Pro at the same text style, so keys sit two
/// steps below body to match the sans text around them.
const KEY_FONT = font({textStyle: 'subheadline', design: 'monospaced'})
const VALUE_FONT = font({textStyle: 'footnote', design: 'monospaced'})

/**
 * A row: the key, and what it holds or a summary of it -- beside the key when
 * short, under it when long, and never cut short.
 */
function Row(props: {name: string; value: string; color: ColorValue}): React.ReactNode {
	let value = (
		<Text modifiers={[VALUE_FONT, foregroundStyle(props.color), textSelection(true)]}>
			{props.value}
		</Text>
	)
	if (stacksValue(props.value)) {
		return (
			<VStack
				alignment="leading"
				modifiers={[frame({maxWidth: Infinity, alignment: 'leading'})]}
				spacing={4}
			>
				<Text modifiers={[KEY_FONT]}>{props.name}</Text>
				{value}
			</VStack>
		)
	}
	return (
		<HStack spacing={8}>
			<Text modifiers={[KEY_FONT]}>{props.name}</Text>
			<Spacer />
			{value}
		</HStack>
	)
}

/** One entry: a closed group for an object or array, opened on a tap; else its value. */
function Entry({entry}: {entry: JsonEntry}): React.ReactNode {
	let {key, value} = entry
	let command = React.useContext(ExpandContext)
	// A group opened after Expand or Collapse All follows it; otherwise it
	// starts open when it holds only a few values.
	let [isOpen, setOpen] = React.useState(() =>
		command.mode === null ? isContainer(value) && startsOpen(value) : command.mode === 'all',
	)
	let seenCount = React.useRef(command.count)
	React.useEffect(() => {
		if (command.count !== seenCount.current) {
			seenCount.current = command.count
			setOpen(command.mode === 'all')
		}
	}, [command])

	if (!isContainer(value)) {
		let leaf = jsonLeaf(value)
		return <Row color={LEAF_COLORS[leaf.kind]} name={key} value={leaf.text} />
	}
	// An empty object or array has nothing to open, so it gets no chevron.
	if (!jsonEntries(value).length) {
		return <Row color={c.secondaryLabel} name={key} value={jsonSummary(value)} />
	}
	return (
		<DisclosureGroup isExpanded={isOpen} onIsExpandedChange={setOpen}>
			<DisclosureGroup.Label>
				<Row color={c.secondaryLabel} name={key} value={jsonSummary(value)} />
			</DisclosureGroup.Label>
			{/* built only once open, so a closed group costs nothing */}
			{isOpen ? <Entries value={value} /> : null}
		</DisclosureGroup>
	)
}

/** An object's or array's entries, a page at a time. */
function Entries({value}: {value: Record<string, unknown> | unknown[]}): React.ReactNode {
	let [shown, setShown] = React.useState(PAGE)
	let entries = jsonEntries(value)
	let rest = entries.length - shown
	return (
		<>
			{entries.slice(0, shown).map((entry) => (
				<Entry entry={entry} key={entry.key} />
			))}
			{rest > 0 ? (
				<Button
					label={`Show ${Math.min(PAGE, rest)} more of ${rest}`}
					onPress={() => setShown((current) => current + PAGE)}
				/>
			) : null}
		</>
	)
}

/**
 * A JSON value to explore: its top level listed, each object or array in it a
 * group that opens to show what it holds -- open from the start when it holds
 * only a few values, and all at once on `expand`.
 */
export function JsonTree(props: {value: unknown; expand?: ExpandCommand}): React.ReactNode {
	let {value, expand = {mode: null, count: 0}} = props
	return (
		<ExpandContext.Provider value={expand}>
			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					{isContainer(value) ? (
						<Entries value={value} />
					) : (
						<Row
							color={LEAF_COLORS[jsonLeaf(value).kind]}
							name="value"
							value={jsonLeaf(value).text}
						/>
					)}
				</List>
			</Host>
		</ExpandContext.Provider>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
