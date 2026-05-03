import * as React from 'react'
import {Image, PixelRatio, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {Score} from './types'

type Props = {
	data: Score[]
	/** When true, show a date prefix above each game (used in Upcoming view). */
	includePrefix?: boolean
}

export function AthleticsRow({data}: Props): React.ReactNode {
	return (
		<>
			{data.map((item, index) => {
				if (item.prescore_info === 'No team scores') {
					return null
				}

				return (
					<View key={`${index}-${item.id}`} style={styles.rowContainer}>
						<Text style={styles.sportName}>{item.sport}</Text>
						<View style={styles.container}>
							<View style={styles.teamLeft}>
								{item.hometeam_logo ? (
									<Image
										accessibilityIgnoresInvertColors={true}
										source={{uri: item.hometeam_logo}}
										style={styles.teamLogo}
									/>
								) : null}
								<Text style={styles.teamName}>{item.hometeam.trim()}</Text>
							</View>

							<View style={styles.gameInfo}>
								{item.status.indicator === 'A' ? (
									<Text style={styles.infoTime}>{item.time}</Text>
								) : (
									<>
										<Text style={styles.infoProcess} />
										{item.status.indicator === 'O' && (
											<View style={styles.infoScorePanel}>
												<Text style={styles.infoScore}>{item.team_score}</Text>
												<View style={styles.infoDivider} />
												<Text style={styles.infoScore}>
													{item.opponent_score}
												</Text>
											</View>
										)}
									</>
								)}
							</View>

							<View style={styles.teamRight}>
								{item.opponent_logo ? (
									<Image
										accessibilityIgnoresInvertColors={true}
										source={{uri: item.opponent_logo}}
										style={styles.teamLogo}
									/>
								) : null}
								<Text style={styles.teamName}>{item.opponent.trim()}</Text>
							</View>
						</View>
					</View>
				)
			})}
		</>
	)
}

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
