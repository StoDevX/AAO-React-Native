import * as React from 'react'
import {Stack} from 'expo-router'
import {Host, Image, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	foregroundStyle,
	menuActionDismissBehavior,
	tint,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {NewsSource} from './sources'

/**
 * Combined source + category picker. Selecting a category implicitly selects
 * its source. Deselecting a category shows all stories from that source.
 */
type Props = {
	sources: NewsSource[]
	/** Categories keyed by source id */
	categoriesBySource: Record<string, string[]>
	selectedSource: string
	selectedCategory: string | null
	onSelect: (source: string, category: string | null) => void
}

const STAYS_OPEN = [menuActionDismissBehavior('disabled')]
const LABEL = accessibilityLabel('News filter')
const ACTIVE_STYLE = [
	LABEL,
	buttonStyle('borderedProminent'),
	tint(c.systemBlue),
	foregroundStyle(c.white),
]
const INACTIVE_STYLE = [LABEL, foregroundStyle(c.label)]

export function NewsPicker({
	sources,
	categoriesBySource,
	selectedSource,
	selectedCategory,
	onSelect,
}: Props): React.ReactNode {
	let isActive = selectedCategory !== null
	let menuModifiers = isActive ? ACTIVE_STYLE : INACTIVE_STYLE

	let handleToggle = (source: string, category: string) => {
		// Tapping selected category deselects it → shows all from that source
		if (source === selectedSource && category === selectedCategory) {
			onSelect(source, null)
		} else {
			// Tapping any category selects source + category
			onSelect(source, category)
		}
	}

	// Z-A in code → A-Z visually: SwiftUI Menu Section renders bottom-to-top
	let sortedSources = [...sources].reverse()

	return (
		<Stack.Toolbar placement="bottom">
			<Stack.Toolbar.Spacer />
			<Stack.Toolbar.View>
				<Host matchContents={true}>
					<Menu label={<Image systemName="newspaper" />} modifiers={menuModifiers}>
						{sortedSources.map((source) => {
							let categories = categoriesBySource[source.id] ?? []
							let sortedCategories = [...categories].sort((a, b) => b.localeCompare(a))
							let isSourceSelected = source.id === selectedSource

							return (
								<Section key={source.id} modifiers={STAYS_OPEN} title={source.title.toUpperCase()}>
									{sortedCategories.map((cat) => (
										<Toggle
											isOn={isSourceSelected && selectedCategory === cat}
											key={cat}
											label={cat}
											onIsOnChange={() => handleToggle(source.id, cat)}
										/>
									))}
								</Section>
							)
						})}
					</Menu>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
