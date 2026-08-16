import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Button, Form, Host, Link, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	disabled as disabledModifier,
	font,
	foregroundColor,
	listRowBackground,
	listRowSeparator,
	multilineTextAlignment,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import type {EventType} from '@frogpond/event-type'

import {EventDetailHeader} from './event-detail-header'
import {getTimes} from './calendar-util'
import type {PoweredBy} from './types'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

function TextSection({header, content}: {header: string; content: string}) {
	return content ? (
		<Section title={header}>
			<Text modifiers={[foregroundColor(c.label), textSelection(true)]}>{content}</Text>
		</Section>
	) : null
}

type Props = {
	event: EventType
	poweredBy: PoweredBy
}

export function EventDetail({event, poweredBy}: Props): React.ReactNode {
	let times = getTimes(event).trim()

	return (
		<Host style={styles.host}>
			<Form>
				<Section>
					<EventDetailHeader times={times} title={event.title.trim()} />
				</Section>

				<TextSection content={event.location.trim()} header="Location" />
				<TextSection content={event.description.trim()} header="Description" />

				{event.links.length > 0 ? (
					<Section title="Links">
						{event.links.map((href) => (
							<Link destination={href} key={href} label={href} />
						))}
					</Section>
				) : null}

				<AddToCalendar
					event={event}
					render={({message, disabled, onPress}) => (
						// `footer` is a SwiftUI slot: a bare string here crashes at mount.
						<Section footer={message ? <Text>{message}</Text> : undefined}>
							<Button
								modifiers={[
									buttonStyle('plain'),
									accessibilityLabel('Add to calendar'),
									disabledModifier(disabled),
								]}
								onPress={onPress}
							>
								<Text modifiers={[foregroundColor(c.systemBlue)]}>Add to calendar</Text>
							</Button>
						</Section>
					)}
				/>

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
								foregroundColor(c.secondaryLabel),
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
