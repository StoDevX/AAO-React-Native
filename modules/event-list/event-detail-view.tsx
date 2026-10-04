import * as React from 'react'
import {StyleSheet, type ColorValue} from 'react-native'
import {Form, Host, Link, Text, VStack} from '@expo/ui/swift-ui'
import {SheetSection} from '@frogpond/sheet-section'
import {
	font,
	foregroundStyle,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	multilineTextAlignment,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {EventType} from '@frogpond/event-type'

import {InsetImageRow} from '../../source/components/inset-image-row'
import {EventDetailHeader} from './event-detail-header'
import {EventTimeline} from './event-timeline'
import {detailTimeLines} from './times'
import type {TimelineBlock, TimelineWindow} from './timeline'
import type {PoweredBy} from './types'

/// The form already insets its rows from the sheet's sides, in line with its
/// section cards, so the picture's row adds none of its own.
const IMAGE_ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
]

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

function TextSection({header, content}: {header: string; content: string}) {
	return content ? (
		<SheetSection title={header}>
			<Text modifiers={[foregroundStyle(c.label), textSelection(true)]}>{content}</Text>
		</SheetSection>
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
	/**
	 * The event's neighbours, already positioned, and the colour lookup their
	 * blocks are tinted by. One optional bundling both rather than two
	 * separate ones: `colorFor` means nothing without `blocks` to tint, and a
	 * timeline with no `colorFor` would silently draw nothing, so the two
	 * cannot be passed independently. Absent for a source with no
	 * surrounding-events query behind it -- the radio schedules -- and for an
	 * all-day event, which has no position to draw.
	 */
	timeline?: {
		window: TimelineWindow
		blocks: TimelineBlock[]
		colorFor: (sourceId: string) => ColorValue
	}
}

export function EventDetail({event, poweredBy, color, timeline}: Props): React.ReactNode {
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

				{event.image ? (
					<SheetSection>
						<InsetImageRow
							rowModifiers={IMAGE_ROW}
							source={{uri: event.image}}
							testID="event-featured-image"
						/>
					</SheetSection>
				) : null}

				<TextSection content={event.location.trim()} header="Location" />
				<TextSection content={event.description.trim()} header="Description" />

				{timeline ? (
					<SheetSection>
						<EventTimeline
							blocks={timeline.blocks}
							colorFor={timeline.colorFor}
							window={timeline.window}
						/>
					</SheetSection>
				) : null}

				{event.links.length > 0 ? (
					<SheetSection title="Links">
						{event.links.map((href) => (
							<Link destination={href} key={href} label={href} />
						))}
					</SheetSection>
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
