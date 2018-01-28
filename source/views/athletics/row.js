// @flow
import React from 'react'
import {
	StyleSheet,
	ScrollView,
	View,
	Text,
	Image,
	PixelRatio,
} from 'react-native'

import * as c from '../components/colors'

export function AthleticsRow({data}) {
	// fields
	//
	// id, timestamp, date, dateFormatted, time, location[location, HAN, facilitiy]
	// sport, hometeam, opponent, location.location
	// team_score, opponent_score,
	// status[indicator, value], ip_time
	// result, prescore_info, postscore_info
	// hometeam_logo, opponent_logo
	// links[ postgame[url, text] boxscore[url, text] ]
	// coverage[]

	/*
   * ideas/todo
   *
   * - work out the d.prescore_info ? d.prescore_info : d.status.indicator logic
   *   so that we display ip_time if present as well
   *
   * - fixup the stylings... it doesn't look fantastic at the moment
   *   https://github.com/wwayne/react-native-nba-app
   *
   * - add touchable to the rows? was getting a promise rejection with touchable
   *
   * - put sport title somewhere else
   *
   * - group by (id? date? sport?)
   *
   * - sorting/filtering! date (upcoming), sport
   *
   * - refreshing for up-to-date data would be cool (e.g. transport, hours...)
   *
   * - pull in the roster files for Olaf, parse them, and show team rosters?
   *
   * - ask hawken about his dual column idea again
   */

	// function evaluateGameType(game) {
	//   let gameProcess = ''
	//   let cssType = ''
	//   switch (game.status.indicator) {
	//   case 'A':
	//     gameProcess = game.date.replace(/\s*ET\s*/, '')
	//     cssType = 'Unstart'
	//     break
	//   case 'I': // if that is a case for in-progress
	//     gameProcess = game.ip_time + ' ' + game.presore_info ????
	//     break
	//   case 'O':
	//     gameProcess += game.process.quarter + ' '
	//     gameProcess += game.process.time.replace(/\s+/, '')
	//     cssType = 'Live'
	//     break
	//   default:
	//     return
	// }

	return (
		<ScrollView>
			{data.map((d, i) => (
				<View key={`${i}`}>
					<Text style={styles.sportName}>{d.sport.trim()}</Text>
					<View style={styles.container}>
						<View style={styles.team}>
							{d.hometeam_logo ? (
								<Image
									style={styles.teamLogo}
									source={{uri: d.hometeam_logo}}
								/>
							) : null}
							<Text style={styles.teamName}>
								{d.hometeam.trim().toUpperCase()}
							</Text>
						</View>

						<View style={styles.gameInfo}>
							<Text style={styles.infoProcess}>
								{d.prescore_info ? d.prescore_info : d.status.indicator}
							</Text>
							{d.status.indicator !== 'A' && (
								<View style={styles.infoScorePanel}>
									<Text style={styles.infoScore}>{d.team_score}</Text>
									<View style={styles.infoDivider} />
									<Text style={styles.infoScore}>{d.opponent_score}</Text>
								</View>
							)}
						</View>

						<View style={styles.team}>
							{d.opponent_logo ? (
								<Image
									style={styles.teamLogo}
									source={{uri: d.opponent_logo}}
								/>
							) : null}
							<Text style={styles.teamName}>
								{d.opponent.trim().toUpperCase()}
							</Text>
						</View>
					</View>
				</View>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
		borderRadius: 5,
		flex: 1,
		flexDirection: 'row',
		marginHorizontal: 12,
    paddingHorizontal: 12,
		marginBottom: 10,
	},
	sportName: {
		color: c.black,
		fontWeight: '500',
		fontSize: 16,
		padding: 5,
		textAlign: 'center',
	},
	team: {
		alignItems: 'center',
		borderRadius: 5,
		flex: 1.5,
	},
	teamLogo: {
		width: 50,
		height: 50,
		marginTop: 12,
		marginBottom: 10,
    resizeMode: 'contain',
	},
	teamCity: {
		color: c.black,
		fontSize: 11,
		marginTop: 2,
	},
	teamName: {
		color: c.black,
		fontWeight: 'bold',
		fontSize: 13,
		position: 'relative',
		paddingBottom: 12,
		justifyContent: 'center',
		textAlign: 'center',
	},
	gameInfo: {
		alignItems: 'center',
		flex: 1.5,
		flexDirection: 'column',
	},
	infoProcess: {
		color: c.black,
		fontSize: 10,
		marginTop: 22,
		marginBottom: 3,
	},
	processUnstart: {
		fontSize: 22,
		position: 'relative',
		top: 13,
	},
	infoScorePanel: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
	},
	infoScore: {
		color: c.black,
		fontWeight: '500',
		fontSize: 24,
		textAlign: 'center',
		width: 50,
	},
	infoDivider: {
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		height: 25,
		marginTop: 7,
		marginLeft: 10,
		marginRight: 10,
		width: 2 / PixelRatio.get(),
	},
})
