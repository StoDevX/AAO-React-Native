import * as React from 'react'
import {StyleSheet, type ColorValue} from 'react-native'
import {Form, Host, Link, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	listRowBackground,
	listRowSeparator,
	multilineTextAlignment,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {EventType} from '@frogpond/event-type'

import {EventDetailHeader} from './event-detail-header'
import {detailTimeLines} from './times'
import type {PoweredBy} from './types'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

function TextSection({header, content}: {header: string; content: string}) {
	return content ? (
		<Section title={header}>
			<Text modifiers={[foregroundStyle(c.label), textSelection(true)]}>{content}</Text>
		</Section>
	) : null
}

type Props = {
	event: EventType
	poweredBy: PoweredBy
	/**
	 * The calendar's colour, for the masthead bar. Passed through rather than
	 * derived here: this component knows an event, not which calendar it
	 * came from.
	 */
	color: ColorValue
}

export function EventDetail({event, poweredBy, color}: Props): React.ReactNode {
	let lines = detailTimeLines(event)

	return (
		<Host style={styles.host}>
			<Form>
				{/* The masthead is not a row of the form, so it loses the grouped-row
				    card the way the attribution below does. It carries the event's name
				    and dates together, flanked by one accent bar. */}
				<VStack modifiers={[listRowBackground('clear'), listRowSeparator('hidden')]}>
					<EventDetailHeader color={color} lines={lines} title={event.title} />
				</VStack>

				<TextSection content={event.location.trim()} header="Location" />
				<TextSection content={event.description.trim()} header="Description" />

				{event.links.length > 0 ? (
					<Section title="Links">
						{event.links.map((href) => (
							<Link destination={href} key={href} label={href} />
						))}
					</Section>
				) : null}

				{/* The attribution is a caption on the form, not a row of it, so the
				    row's background and separator are cleared. Its insets are left
				    alone deliberately: zeroing them pulls the text flush left, out of
				    line with every section header, and leaves `multilineTextAlignment`
				    only the text's own width to centre within. */}
				{poweredBy.title ? (
					<VStack modifiers={[listRowBackground('clear'), listRowSeparator('hidden')]}>
						<Text
							modifiers={[
								font({size: 10}),
								foregroundStyle(c.secondaryLabel),
								multilineTextAlignment('center'),
								textSelection(true),
							]}
						>
							{poweredBy.title}
						</Text>
					</VStack>
				) : null}
			</Form>
		</Host>
	)
}
