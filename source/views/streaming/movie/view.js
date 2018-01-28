// @flow

import React from 'react'
import {
	StyleSheet,
	View,
	SectionList,
	ScrollView,
	Text,
	Image,
} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import * as c from '../../components/colors'
import moment from 'moment-timezone'
import openUrl from '../../components/open-url'
import {Row, Column} from '../../components/layout'
import {ListRow, ListSeparator, Detail, Title} from '../../components/list'
import type {Movie, MovieShowing} from './types'

const MOVIE_URL = 'https://stodevx.github.io/sga-weekly-movies/next.json'

const MAX_VALUE = 200

const ROW_HEIGHT = 60

type Props = {}
type State = {
	loading: boolean,
	movie: ?Movie,
}

function getStyleFromScore(score: string) {
	let numScore = Number.parseFloat(score)

	if (numScore < 0) {
		return styles.noScore
	}

	if (score.indexOf('%') != -1) {
		numScore = numScore / 10
	}

	numScore *= 10

	const normalizedScore = Math.round(numScore / 100 * MAX_VALUE)
	return {
		color:
			'rgb(' +
			(MAX_VALUE - normalizedScore) +
			', ' +
			normalizedScore +
			', ' +
			0 +
			')',
	}
}

export class WeeklyMovieView extends React.Component<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Weekly Movie',
		tabBarIcon: TabBarIcon('film'),
	}

	state = {
		loading: true,
		movie: null,
	}

	componentWillMount() {
		this.fetchMovie()
	}

	fetchMovie = () =>
		fetchJson(MOVIE_URL)
			.then(({movie}) => fetchJson(movie))
			.then(info => this.setState(() => ({movie: info, loading: false})))

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		const {movie} = this.state

		if (!movie) {
			return <NoticeView message="this should never happen" />
		}

		const poster = movie.posters.find(p => p.width == 512)
		const title = movie.info.Title
		const runtime = movie.info.Runtime
		const releasesd = movie.info.Released
		const genre = movie.info.Genre
		const rated = movie.info.Rated
		const ratings = movie.info.Ratings
		const plot = movie.info.Plot
		const cast = movie.info.Actors
		const showings = movie.showings
		const imdbID = movie.info.imdbID

		return (
			<ScrollView contentContainerStyle={styles.contentContainer}>
				<View style={styles.mainSection}>
					{poster && (
						<Image
							resizeMode="contain"
							source={{uri: poster.url}}
							style={[styles.detailsImage]}
						/>
					)}
					<View style={styles.rightPane}>
						<Text style={styles.movieTitle}>{title}</Text>
						<Text>{releasesd}</Text>
						<View style={styles.ratingTimeWrapper}>
							<View style={styles.mpaaWrapper}>
								<Text style={styles.mpaaText}>{rated}</Text>
							</View>
							<Text> • </Text>
							<Text>{runtime}</Text>
						</View>
						<Ratings ratings={ratings} />
					</View>
				</View>
				<View style={styles.separator} />
				<Text>{plot}</Text>
				<View style={styles.separator} />
				<Genre genre={genre} />
				<View style={styles.separator} />
				<Cast actors={cast} />
				<View style={styles.separator} />
				<Showings showings={showings} />
				<View style={styles.separator} />
				<IMDB imdbID={imdbID} />
			</ScrollView>
		)
	}
}

class Ratings extends React.Component<any, any> {
	render() {
		let criticsScore = ''
		let audienceScore = ''

		this.props.ratings.forEach(rating => {
			switch (rating.Source) {
				case 'Internet Movie Database':
					criticsScore = rating.Value
					break
				case 'Rotten Tomatoes':
					audienceScore = rating.Value
					break
				default:
					break
			}
		})

		return (
			<View>
				<View style={styles.rating}>
					<Text style={styles.ratingTitle}>Critics</Text>
					<Text style={[styles.ratingValue, getStyleFromScore(criticsScore)]}>
						{criticsScore}
					</Text>
				</View>
				<View style={styles.rating}>
					<Text style={styles.ratingTitle}>Audience</Text>
					<Text style={[styles.ratingValue, getStyleFromScore(audienceScore)]}>
						{audienceScore}
					</Text>
				</View>
			</View>
		)
	}
}

class Cast extends React.Component<any, any> {
	render() {
		if (!this.props.actors) {
			return null
		}

		return (
			<View>
				<Text style={styles.castTitle}>Cast</Text>
				<Text style={styles.castActor}>{this.props.actors}</Text>
			</View>
		)
	}
}

class Genre extends React.Component<any, any> {
	render() {
		if (!this.props.genre) {
			return null
		}

		return (
			<View>
				<Text style={styles.genreTitle}>Genre</Text>
				<Text style={styles.genre}>{this.props.genre}</Text>
			</View>
		)
	}
}

class Showings extends React.Component<any, any> {
	renderTimes = (item: MovieShowing) =>
		`${moment(item.time).format('dddd')} ${moment(item.time).format(
			'MMM.',
		)} ${moment(item.time).format('Do')} at ${moment(item.time).format(
			'h:mmA',
		)}`

	renderRow = ({item}: {item: MovieShowing}) => (
		<ListRow
			arrowPosition="none"
			contentContainerStyle={[styles.row]}
			fullWidth={true}
		>
			<Row alignItems="flex-start">
				<Column flex={1}>
					<Title lines={1}>{this.renderTimes(item)}</Title>
					<Detail lines={1}>{item.location}</Detail>
				</Column>
			</Row>
		</ListRow>
	)

	renderSeparator = () => <ListSeparator fullWidth={true} />

	keyExtractor = (item: MovieShowing) => item.time

	render() {
		if (!this.props.showings) {
			return null
		}

		const sections = [{title: 'Showings', data: this.props.showings}]

		return (
			<View style={styles.showingsWrapper}>
				<Text style={styles.showingsTitle}>Showings</Text>
				<SectionList
					ItemSeparatorComponent={this.renderSeparator}
					ListEmptyComponent={<Text>No Showings</Text>}
					keyExtractor={this.keyExtractor}
					renderItem={this.renderRow}
					sections={sections}
					style={styles.listContainer}
				/>
			</View>
		)
	}
}

class IMDB extends React.Component<any, any> {
	render() {
		if (!this.props.imdbID) {
			return null
		}

		const url = `https://www.imdb.com/title/${this.props.imdbID}`

		return (
			<View>
				<Text style={styles.imdbTitle}>IMDB Page</Text>
				<Text onPress={() => openUrl(url)} style={styles.imdb}>
					{url}
				</Text>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	contentContainer: {
		padding: 10,
		backgroundColor: c.white,
	},
	listContainer: {
		backgroundColor: c.white,
	},
	showingsWrapper: {
		flex: 1,
	},
	rightPane: {
		justifyContent: 'space-between',
		flex: 1,
	},
	movieTitle: {
		flex: 1,
		fontSize: 23,
		fontWeight: '400',
	},
	rating: {
		marginTop: 10,
	},
	ratingTitle: {
		fontSize: 14,
		fontWeight: '500',
	},
	ratingValue: {
		fontSize: 28,
		fontWeight: '500',
	},
	noScore: {
		color: c.black,
	},
	ratingTimeWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	mpaaWrapper: {
		alignSelf: 'flex-start',
		borderColor: c.black,
		borderWidth: 1,
		paddingHorizontal: 3,
		marginVertical: 5,
	},
	mpaaText: {
		fontFamily: 'Palatino',
		fontSize: 13,
		fontWeight: '500',
	},
	mainSection: {
		flexDirection: 'row',
	},
	detailsImage: {
		width: 134,
		height: 200,
		marginRight: 10,
		shadowOpacity: 0.45,
		shadowRadius: 3,
		shadowColor: c.gray,
		shadowOffset: {height: 0, width: 0},
	},
	separator: {
		backgroundColor: c.semitransparentGray,
		height: StyleSheet.hairlineWidth,
		marginVertical: 10,
	},
	castTitle: {
		fontWeight: '700',
		marginBottom: 3,
	},
	castActor: {
		marginLeft: 2,
	},
	genreTitle: {
		fontWeight: '700',
		marginBottom: 3,
	},
	genre: {
		marginLeft: 2,
	},
	showingsTitle: {
		fontWeight: '700',
		marginBottom: 3,
	},
	imdbTitle: {
		fontWeight: '700',
		marginBottom: 3,
	},
	imdb: {
		marginLeft: 2,
		color: c.infoBlue,
	},
	row: {
		height: ROW_HEIGHT,
	},
})
