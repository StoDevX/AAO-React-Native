import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack} from 'expo-router'
import {Host, List, Section, Text} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	listRowBackground,
	listStyle,
	refreshable,
	scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {sendEmail} from '../../components/send-email'
import {DisclosureRow} from '../../components/rows'
import {UnloadedPage, PAPER_BAR, PaperTitle} from './mess-page'
import {ink, paper, paperTypeface, wash} from './palette'
import {messAboutOptions} from './query'
import {SECTION_HEADING} from './story-blocks'
import type {AboutSection} from './types'

const SECTION = [listRowBackground(wash)]
const PARAGRAPH = [font({textStyle: 'body', design: 'serif'}), foregroundStyle(ink)]

/** A heading of the About page: a row to write to each person under it, then its paragraphs. */
function AboutSectionRows({section}: {section: AboutSection}): React.ReactNode {
	return (
		<Section header={<Text modifiers={SECTION_HEADING}>{section.title}</Text>} modifiers={SECTION}>
			{section.contacts.map((contact) => (
				<DisclosureRow
					key={contact.email}
					destination="external"
					detail={contact.email}
					onPress={() => sendEmail({to: [contact.email]})}
					title={contact.role}
					typeface={paperTypeface}
				/>
			))}
			{section.paragraphs.map((paragraph) => (
				<Text key={paragraph} modifiers={PARAGRAPH}>
					{paragraph}
				</Text>
			))}
		</Section>
	)
}

/**
 * The paper's About page as a list: a section for each of its headings, so the page's own
 * grouping of whom to write to, and its submission policy, carry over as the paper edits them.
 */
export function AboutScreen(): React.ReactNode {
	let about = useQuery(messAboutOptions)

	return (
		<>
			<Stack.Screen options={PAPER_BAR} />
			<PaperTitle title="Contact" />
			{about.data ? (
				<Host style={styles.list}>
					<List
						modifiers={[
							listStyle('insetGrouped'),
							scrollContentBackground('hidden'),
							background(paper),
							refreshable(async () => {
								await about.refetch()
							}),
						]}
					>
						{about.data.map((section) => (
							<AboutSectionRows key={section.title} section={section} />
						))}
					</List>
				</Host>
			) : (
				<UnloadedPage query={about} />
			)}
		</>
	)
}

const styles = StyleSheet.create({
	list: {flex: 1},
})
