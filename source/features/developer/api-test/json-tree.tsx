import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {ColorValue} from 'react-native'
import {Button, DisclosureGroup, Host, HStack, List, Spacer, Text} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	lineLimit,
	listStyle,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {isContainer, jsonEntries, jsonLeaf, jsonSummary, type JsonEntry} from './util/json-tree'

/// How many of an object's or array's entries show before a "show more" row,
/// so opening a long array does not build every row at once.
const PAGE = 100

/// The colours the raw view highlights each kind of value in.
const LEAF_COLORS: Record<ReturnType<typeof jsonLeaf>['kind'], ColorValue> = {
	string: c.systemGreen,
	number: c.systemOrange,
	boolean: c.systemRed,
	null: c.systemPurple,
}

const KEY_FONT = font({textStyle: 'body', design: 'monospaced'})
const VALUE_FONT = font({textStyle: 'footnote', design: 'monospaced'})

/** A row: the key on the left, and on the right what it holds or a summary of it. */
function Row(props: {name: string; value: string; color: ColorValue}): React.ReactNode {
	return (
		<HStack spacing={8}>
			<Text modifiers={[KEY_FONT]}>{props.name}</Text>
			<Spacer />
			<Text
				modifiers={[VALUE_FONT, foregroundStyle(props.color), lineLimit(4), textSelection(true)]}
			>
				{props.value}
			</Text>
		</HStack>
	)
}

/** One entry: a closed group for an object or array, opened on a tap; else its value. */
function Entry({entry}: {entry: JsonEntry}): React.ReactNode {
	let [isOpen, setOpen] = React.useState(false)
	let {key, value} = entry

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
 * group that opens to show what it holds.
 */
export function JsonTree({value}: {value: unknown}): React.ReactNode {
	return (
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
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
