import * as React from 'react'
import {
	Button,
	ContentUnavailableView,
	List,
	ProgressView,
	Section,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	buttonStyle,
	font,
	foregroundStyle,
	lineLimit,
	listStyle,
	refreshable,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import type {DictionaryGroup, NormalizedEntry} from './types'

/// How many lines of the definition a row previews before truncating.
const PREVIEW_LINES = 2

type Props = {
	groups: DictionaryGroup[]
	query: string
	isLoading: boolean
	isError: boolean
	onRetry: () => Promise<unknown>
	onSelect: (entry: NormalizedEntry) => void
}

/**
 * The A-Z list of campus terms. Presentational: the screen owns the query and
 * the selection, so this can be rendered against fixtures in a test.
 */
export function EntryList({
	groups,
	query,
	isLoading,
	isError,
	onRetry,
	onSelect,
}: Props): React.ReactNode {
	if (isError) {
		return (
			<VStack spacing={16}>
				<ContentUnavailableView
					description="Check your connection and try again."
					systemImage="exclamationmark.triangle"
					title="Couldn’t load the dictionary"
				/>
				<Button label="Try Again" onPress={() => void onRetry()} />
			</VStack>
		)
	}

	if (groups.length === 0) {
		if (isLoading) {
			return <ProgressView />
		}

		return (
			<ContentUnavailableView
				systemImage="magnifyingglass"
				title={query ? `No results for “${query}”` : 'No results'}
			/>
		)
	}

	return (
		<List
			modifiers={[
				listStyle('plain'),
				// Awaited, so the spinner stays up for as long as the refetch does.
				refreshable(async () => {
					await onRetry()
				}),
				accessibilityIdentifier('dictionary-list'),
			]}
		>
			{groups.map((group) => (
				<Section key={group.title} title={group.title}>
					{group.data.map((entry) => (
						<Button
							key={entry.word}
							modifiers={[buttonStyle('plain')]}
							onPress={() => onSelect(entry)}
						>
							<VStack alignment="leading" spacing={2}>
								<Text modifiers={[font({textStyle: 'headline'})]}>{entry.word}</Text>
								<Text
									modifiers={[
										font({textStyle: 'subheadline'}),
										foregroundStyle(c.secondaryLabel),
										lineLimit(PREVIEW_LINES),
									]}
								>
									{entry.senses[0].definition}
								</Text>
							</VStack>
						</Button>
					))}
				</Section>
			))}
		</List>
	)
}
