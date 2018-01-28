// @flow

import React from 'react'
import {StyleSheet, View, FlatList, ScrollView, Text, Image} from 'react-native'
import {connect} from 'react-redux'
import {getWeeklyMovie} from '../../../flux/parts/weekly-movie'
import {type ReduxState} from '../../../flux'
import {TabBarIcon} from '../../components/tabbar-icon'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import * as c from '../../components/colors'
import moment from 'moment-timezone'
import openUrl from '../../components/open-url'
import {Row, Column} from '../../components/layout'
import {ListRow, ListSeparator, Detail, Title} from '../../components/list'
import type {Movie, MovieShowing, MovieRating, PosterInfo} from './types'
import {type TopLevelViewPropsType} from '../../types'

const MAX_VALUE = 200

const ROW_HEIGHT = 60

function colorizeScore(score: string) {
	let numScore = Number.parseFloat(score)

	if (numScore < 0) {
		return styles.noScore
	}

	if (score.indexOf('%') != -1) {
		numScore = numScore / 10
	}

	numScore *= 10

	const normalizedScore = Math.round(numScore / 100 * MAX_VALUE)
	return `rgb(${MAX_VALUE - normalizedScore}, ${normalizedScore}, 0)`
}

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {|
	loading: boolean,
	error: ?boolean,
	errorMessage: ?string,
	movie: ?Movie,
|}

type ReduxDispatchProps = {
	getWeeklyMovie: () => any,
}

type Props = ReduxStateProps & ReduxDispatchProps & ReactProps
type State = {}

export class PlainWeeklyMovieView extends React.Component<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Weekly Movie',
		tabBarIcon: TabBarIcon('film'),
	}

	componentWillMount() {
		this.props.getWeeklyMovie()
	}

	render() {
		if (this.props.loading) {
			return <LoadingView />
		}

		if (this.props.error) {
			const msg = this.props.errorMessage || ''
			return (
				<NoticeView
					buttonText="Try Again"
					onPress={this.props.getWeeklyMovie}
					text={`There was a problem loading the movie: ${msg}`}
				/>
			)
		}

		const {movie} = this.props

		if (!movie) {
			return <NoticeView text="this should never happen" />
		}

		return (
			<ScrollView contentContainerStyle={styles.contentContainer}>
				<View style={styles.mainSection}>
					<Poster posters={movie.posters} size={512} />
					<View style={styles.rightPane}>
						<Text style={styles.movieTitle}>{movie.info.Title}</Text>
						<Text>{movie.info.Released}</Text>

						<View style={styles.mpaaTimeWrapper}>
							<View style={styles.mpaaWrapper}>
								<Text style={styles.mpaaText}>{movie.info.Rated}</Text>
							</View>
							<Text> • </Text>
							<Text>{movie.info.Runtime}</Text>
						</View>

						<Ratings ratings={movie.info.Ratings} />
					</View>
				</View>
				<Separator />
				<Text>{movie.info.Plot}</Text>
				<Separator />
				<Genre genre={movie.info.Genre} />
				<Separator />
				<Cast actors={movie.info.Actors} />
				<Separator />
				<Showings showings={movie.showings} />
				<Separator />
				<IMDB imdbID={movie.info.imdbID} />
			</ScrollView>
		)
	}
}

const mapState = (state: ReduxState): ReduxStateProps => {
	return {
		loading: state.weeklyMovie ? state.weeklyMovie.fetching : true,
		error: state.weeklyMovie ? state.weeklyMovie.lastFetchError : null,
		errorMessage: state.weeklyMovie
			? state.weeklyMovie.lastFetchErrorMessage
			: null,
		movie: state.weeklyMovie ? state.weeklyMovie.movie : null,
	}
}

const mapDispatch = (dispatch): ReduxDispatchProps => {
	return {
		getWeeklyMovie: () => dispatch(getWeeklyMovie()),
	}
}

export const WeeklyMovieView = connect(mapState, mapDispatch)(
	PlainWeeklyMovieView,
)

const Separator = () => <View style={styles.separator} />

const Poster = (props: {posters: Array<PosterInfo>, size: number}) => {
	const {posters, size} = props
	const poster = posters.find(p => p.width === size)

	if (!poster) {
		return null
	}

	return (
		<Image
			resizeMode="contain"
			source={{uri: poster.url}}
			style={[styles.detailsImage]}
		/>
	)
}

const Ratings = ({ratings}: {ratings: Array<MovieRating>}) => {
	let scores = ratings
		.map(r => {
			switch (r.Source) {
				case 'Internet Movie Database':
					return {title: 'Critics', score: r.Value}
				case 'Rotten Tomatoes':
					return {title: 'Audience', score: r.Value}
				default:
					return null
			}
		})
		.filter(Boolean)
		.sort((a, b) => (a.title < b.title ? -1 : a.title === b.title ? 0 : 1))
		.reverse()

	return (
		<View>
			{scores.map(info => (
				<View key={info.title} style={styles.rating}>
					<Text style={styles.ratingTitle}>{info.title}</Text>
					<Text
						style={[styles.ratingValue, {color: colorizeScore(info.score)}]}
					>
						{info.score}
					</Text>
				</View>
			))}
		</View>
	)
}

const Cast = ({actors}: {actors: string}) => (
	<View>
		<Text style={styles.castTitle}>Cast</Text>
		<Text style={styles.castActor}>{actors}</Text>
	</View>
)

const Genre = ({genre}: {genre: string}) => (
	<View>
		<Text style={styles.genreTitle}>Genre</Text>
		<Text style={styles.genre}>{genre}</Text>
	</View>
)

class Showings extends React.Component<any, any> {
	renderTimes = (item: MovieShowing) => {
		let m = moment(item.time)
		let dayOfWeek = m.format('dddd')
		let month = m.format('MMM.')
		let dayOfMonth = m.format('Do')
		let time = m.format('h:mmA')
		return `${dayOfWeek} ${month} ${dayOfMonth} at ${time}`
	}

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
		let {showings = []} = this.props

		return (
			<View style={styles.showingsWrapper}>
				<Text style={styles.showingsTitle}>Showings</Text>
				<FlatList
					ItemSeparatorComponent={this.renderSeparator}
					ListEmptyComponent={<Text>No Showings</Text>}
					data={showings}
					keyExtractor={this.keyExtractor}
					renderItem={this.renderRow}
					style={styles.listContainer}
				/>
			</View>
		)
	}
}

class IMDB extends React.Component<any, any> {
	url = imdbID => `https://www.imdb.com/title/${imdbID}`

	open = () => {
		openUrl(this.url(this.props.imdbID))
	}

	render() {
		if (!this.props.imdbID) {
			return null
		}

		return (
			<View>
				<Text style={styles.imdbTitle}>IMDB Page</Text>
				<Text onPress={this.open} style={styles.imdb}>
					{this.url(this.props.imdbID)}
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
	mpaaTimeWrapper: {
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
