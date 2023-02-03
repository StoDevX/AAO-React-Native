import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {OutlineBadge, SolidBadge} from '@frogpond/badge'
import {Section} from '@frogpond/tableview'
import {LibraryWrapper, Example} from './base/library-wrapper'

const OutlineBadgeExamples = (): JSX.Element => (
	<Section header="Outline badge">
		<Example title="Default">
			<OutlineBadge text="Status" />
		</Example>

		<Example title="Overriding styles">
			<OutlineBadge
				accentColor={c.systemGreen}
				style={styles.overriden}
				textColor={c.label}
				textStyle={styles.overridenText}
				text="Status"
			/>
		</Example>

		<Example title="Hours open">
			<OutlineBadge
				accentColor={c.systemGreen}
				textColor={c.label}
				text="Open"
			/>
		</Example>

		<Example title="Hours closed">
			<OutlineBadge
				accentColor={c.systemRed}
				textColor={c.label}
				text="Closed"
			/>
		</Example>
	</Section>
)

const SolidBadgeExamples = (): JSX.Element => (
	<Section header="Solid badge">
		<Example title="Default">
			<SolidBadge status="Status" />
		</Example>

		<Example title="Accent color">
			<SolidBadge accentColor={c.systemGreen} status="Open" />
		</Example>

		<Example title="Accent and text color">
			<SolidBadge
				accentColor={c.systemRed}
				status="Closed"
				textColor={c.systemBlue}
			/>
		</Example>
	</Section>
)

export const BadgeLibrary = (): JSX.Element => (
	<LibraryWrapper>
		<>
			<OutlineBadgeExamples />
			<SolidBadgeExamples />
		</>
	</LibraryWrapper>
)

const styles = StyleSheet.create({
	overriden: {
		backgroundColor: c.systemTeal,
	},
	overridenText: {
		fontWeight: '700',
		...Platform.select({
			ios: {
				fontSize: 16,
				color: c.label,
			},
			android: {
				fontSize: 16,
				fontFamily: 'sans-serif-condensed',
			},
		}),
	},
})
