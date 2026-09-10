import * as React from 'react'
import {Image as RNImage, StyleSheet} from 'react-native'
import {HStack, RNHostView, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityLabel,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	multilineTextAlignment,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {gameSummary} from './utils'
import type {ProcessedScore} from './types'

const LOGO_SIZE = 30
/// Wide enough for a two-digit score either side of the dash without the
/// teams' names shifting as a game goes on.
const SCORE_WIDTH = 96

const TEAM_MODIFIERS = [
	font({textStyle: 'caption'}),
	foregroundStyle(c.label),
	multilineTextAlignment('center'),
	lineLimit(2),
]

type Props = {
	score: ProcessedScore
}

function TeamLogo({uri}: {uri: string}): React.ReactNode {
	if (!uri) {
		return null
	}

	// `@expo/ui`'s Image reads only SF Symbols and local files, so a team's
	// crest is a React Native image hosted in the row -- and RNHostView gives a
	// hosted view no bounds of its own, hence the frame.
	return (
		<HStack modifiers={[frame({width: LOGO_SIZE, height: LOGO_SIZE})]}>
			<RNHostView matchContents={false}>
				<RNImage accessibilityIgnoresInvertColors={true} source={{uri}} style={styles.logo} />
			</RNHostView>
		</HStack>
	)
}

/**
 * One fixture: the sport it is, the two teams with their crests, and either a
 * kickoff time or the score between them.
 *
 * The whole row is one accessibility element. Read field by field a scoreboard
 * announces six fragments and says very little; `gameSummary` builds the
 * sentence a reader actually wants.
 */
export const AthleticsRow = React.memo(function AthleticsRow({score}: Props): React.ReactNode {
	let summary = gameSummary(score)

	return (
		<VStack
			modifiers={[accessibilityElement('combine'), accessibilityLabel(summary.accessibilityLabel)]}
			spacing={4}
		>
			<Text modifiers={[font({textStyle: 'caption2', weight: 'bold'}), foregroundStyle(c.label)]}>
				{score.sport}
			</Text>

			<HStack spacing={8}>
				<VStack modifiers={[frame({maxWidth: Infinity})]} spacing={4}>
					<TeamLogo uri={score.hometeam_logo} />
					<Text modifiers={TEAM_MODIFIERS}>{score.hometeam.trim()}</Text>
				</VStack>

				<VStack modifiers={[frame({width: SCORE_WIDTH})]} spacing={2}>
					<Text
						modifiers={[
							font({
								textStyle: summary.showsTime ? 'body' : 'title2',
								weight: summary.showsTime ? 'regular' : 'medium',
							}),
							foregroundStyle(c.label),
							multilineTextAlignment('center'),
						]}
					>
						{summary.label}
					</Text>
				</VStack>

				<VStack modifiers={[frame({maxWidth: Infinity})]} spacing={4}>
					<TeamLogo uri={score.opponent_logo} />
					<Text modifiers={TEAM_MODIFIERS}>{score.opponent.trim()}</Text>
				</VStack>
			</HStack>
		</VStack>
	)
})

const styles = StyleSheet.create({
	logo: {
		height: LOGO_SIZE,
		width: LOGO_SIZE,
		resizeMode: 'contain',
	},
})
