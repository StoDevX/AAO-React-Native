import * as React from 'react'
import {Image, PixelRatio, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {ProcessedScore} from './types'

type Props = {
	score: ProcessedScore
}

export const AthleticsRow = React.memo(({score}: Props): React.ReactNode => {
	// Show time only for games that haven't started yet (status A, no result).
	// For ongoing (O) and finalized (result is W/L/N) games, show the score panel.
	const showTime = score.status.indicator === 'A' && score.result === ''
	// All-day and multi-day fixtures carry no `time` string.
	const timeText = score.time || 'All day'
	const gameInfoLabel = showTime
		? timeText
		: [score.result, `${score.team_score}-${score.opponent_score}`].filter(Boolean).join(' ')
	const accessibilityLabel = `${score.sport}: ${score.hometeam.trim()} vs ${score.opponent.trim()}, ${gameInfoLabel}`

	return (
		<View
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="text"
			accessible={true}
			style={styles.rowContainer}
		>
			<Text style={styles.sportName}>{score.sport}</Text>
			<View style={styles.container}>
				<View style={styles.teamLeft}>
					{score.hometeam_logo ? (
						<Image
							accessibilityIgnoresInvertColors={true}
							source={{uri: score.hometeam_logo}}
							style={styles.teamLogo}
						/>
					) : null}
					<Text style={styles.teamName}>{score.hometeam.trim()}</Text>
				</View>

				<View style={styles.gameInfo}>
					{showTime ? (
						<Text style={styles.infoTime}>{timeText}</Text>
					) : (
						<>
							{score.result !== '' && <Text style={styles.infoProcess}>{score.result}</Text>}
							<View style={styles.infoScorePanel}>
								<Text style={styles.infoScore}>{score.team_score}</Text>
								<View style={styles.infoDivider} />
								<Text style={styles.infoScore}>{score.opponent_score}</Text>
							</View>
						</>
					)}
				</View>

				<View style={styles.teamRight}>
					{score.opponent_logo ? (
						<Image
							accessibilityIgnoresInvertColors={true}
							source={{uri: score.opponent_logo}}
							style={styles.teamLogo}
						/>
					) : null}
					<Text style={styles.teamName}>{score.opponent.trim()}</Text>
				</View>
			</View>
		</View>
	)
})
AthleticsRow.displayName = 'AthleticsRow'

const styles = StyleSheet.create({
	rowContainer: {
		backgroundColor: c.systemBackground,
		borderRadius: 10,
		elevation: 3,
		marginHorizontal: 3,
		marginVertical: 5,
		padding: 3,
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.1,
		shadowRadius: 5,
	},
	container: {
		alignItems: 'center',
		backgroundColor: c.systemBackground,
		borderRadius: 5,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 5,
	},
	teamLeft: {
		alignItems: 'center',
		flex: 1,
	},
	teamRight: {
		alignItems: 'center',
		flex: 1,
	},
	teamLogo: {
		height: 30,
		marginVertical: 4,
		width: 30,
	},
	sportName: {
		color: c.label,
		fontSize: 11,
		fontWeight: 'bold',
		padding: 2,
		textAlign: 'center',
	},
	teamName: {
		color: c.label,
		fontSize: 12,
		textAlign: 'center',
	},
	gameInfo: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
	},
	infoProcess: {
		color: c.label,
		fontSize: 8,
		marginVertical: 2,
	},
	infoTime: {
		color: c.label,
		fontSize: 14,
		textAlign: 'center',
	},
	infoScorePanel: {
		alignItems: 'center',
		flexDirection: 'row',
		height: '100%',
		justifyContent: 'center',
	},
	infoScore: {
		color: c.label,
		fontSize: 20,
		fontWeight: '500',
		textAlign: 'center',
		width: 40,
	},
	infoDivider: {
		backgroundColor: c.systemGray,
		height: 20,
		marginHorizontal: 8,
		width: 2 / PixelRatio.get(),
	},
})
