// @flow

import * as React from 'react'
import {StyleSheet, View, ScrollView, Text, Image} from 'react-native'
import {connect} from 'react-redux'
import {getWeeklyMovie} from '../../../flux/parts/weekly-movie'
import {type ReduxState} from '../../../flux'
import {TabBarIcon} from '../../components/tabbar-icon'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import * as c from '../../components/colors'
import moment from 'moment-timezone'
import openUrl from '../../components/open-url'
import {Column} from '../../components/layout'
import {ListRow, ListSeparator, Detail, Title} from '../../components/list'
import {type TopLevelViewPropsType} from '../../types'
import type {
	Movie,
	MovieShowing,
	MovieRating,
	PosterInfo,
	RGBTuple,
} from './types'

function colorizeScore(score: string) {
	let numScore = Number.parseFloat(score)

	if (numScore < 0) {
		return 'black'
	}

	if (score.indexOf('%') !== -1) {
		numScore = numScore / 10
	}

	numScore *= 10

	const MAX_VALUE = 200
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

export class PlainWeeklyMovieView extends React.Component<Props> {
	static navigationOptions = {
		tabBarLabel: 'Weekly Movie',
		tabBarIcon: TabBarIcon('film'),
	}

	componentWillMount() {
		this.props.getWeeklyMovie()
	}

	render() {
		const {movie, loading, error} = this.props

		if (loading) {
			return <LoadingView />
		}

		if (error) {
			const msg = this.props.errorMessage || ''
			return (
				<NoticeView
					buttonText="Try Again"
					onPress={this.props.getWeeklyMovie}
					text={`There was a problem loading the movie: ${msg}`}
				/>
			)
		}

		if (!movie) {
			return <NoticeView text="this should never happen" />
		}

		return (
			<ScrollView contentContainerStyle={styles.contentContainer}>
				<View style={styles.movieInfo}>
					<Poster
						posters={movie.posters}
						size={512}
						tint={movie.posterColors.dominant}
					/>

					<View style={styles.rightPane}>
						<Text style={styles.movieTitle}>{movie.info.Title}</Text>
						<Text>{movie.info.Released}</Text>

						<View style={styles.centeredRow}>
							<View style={styles.mpaa}>
								<Text style={styles.mpaaRating}>{movie.info.Rated}</Text>
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

const Separator = () => (
	<ListSeparator fullWidth={true} styles={styles.separator} />
)

const Poster = (props: {
	posters: Array<PosterInfo>,
	size: number,
	tint: RGBTuple,
}) => {
	const {posters, size, tint} = props
	const poster = posters.find(p => p.width === size)

	if (!poster) {
		return null
	}

	const shadowColor = `rgb(${tint[0]}, ${tint[1]}, ${tint[2]})`
	return (
		<Image
			resizeMode="contain"
			source={{uri: poster.url}}
			style={[styles.moviePoster, {shadowColor}]}
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
		.map(r => ({...r, tint: colorizeScore(r.score)}))
		.sort((a, b) => (a.title < b.title ? -1 : a.title === b.title ? 0 : 1))
		.reverse()

	return scores.map(info => (
		<React.Fragment key={info.title}>
			<Text style={styles.ratingTitle}>{info.title}</Text>
			<Text style={[styles.rating, {color: info.tint}]}>{info.score}</Text>
		</React.Fragment>
	))
}

const Cast = ({actors}: {actors: string}) => (
	<React.Fragment>
		<Text style={styles.sectionTitle}>Cast</Text>
		<Text>{actors}</Text>
	</React.Fragment>
)

const Genre = ({genre}: {genre: string}) => (
	<React.Fragment>
		<Text style={styles.sectionTitle}>Genre</Text>
		<Text>{genre}</Text>
	</React.Fragment>
)

const showingTimesToString = (showing: MovieShowing) => {
	let m = moment(showing.time)
	let dayOfWeek = m.format('dddd')
	let month = m.format('MMM.')
	let dayOfMonth = m.format('Do')
	let time = m.format('h:mmA')
	return `${dayOfWeek} ${month} ${dayOfMonth} at ${time}`
}

const Showings = ({showings = []}: {showings: MovieShowing[]}) => (
	<React.Fragment>
		<Text style={styles.sectionTitle}>Showings</Text>
		{showings.length ? (
			showings.map((showing, i, arr) => (
				<React.Fragment key={showing.time}>
					<ListRow arrowPosition="none" fullWidth={true}>
						<Column flex={1}>
							<Title lines={1}>{showingTimesToString(showing)}</Title>
							<Detail lines={1}>{showing.location}</Detail>
						</Column>
					</ListRow>
					{i !== arr.length - 1 ? <ListSeparator fullWidth={true} /> : null}
				</React.Fragment>
			))
		) : (
			<Text>No Showings</Text>
		)}
	</React.Fragment>
)

class IMDB extends React.Component<any, any> {
	url = imdbID => `https://www.imdb.com/title/${imdbID}`

	open = () => openUrl(this.url(this.props.imdbID))

	render() {
		if (!this.props.imdbID) {
			return null
		}

		return (
			<React.Fragment>
				<Text style={styles.sectionTitle}>IMDB Page</Text>
				<Text onPress={this.open} style={styles.imdb}>
					{this.url(this.props.imdbID)}
				</Text>
			</React.Fragment>
		)
	}
}

const styles = StyleSheet.create({
	contentContainer: {
		padding: 10,
		backgroundColor: c.white,
	},
	rightPane: {
		flex: 1,
		justifyContent: 'space-between',
	},
	movieTitle: {
		fontSize: 23,
		fontWeight: '400',
	},
	ratingTitle: {
		marginTop: 10,
		fontSize: 14,
		fontWeight: '500',
	},
	rating: {
		fontSize: 28,
		fontWeight: '500',
	},
	centeredRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	mpaa: {
		alignSelf: 'flex-start',
		borderColor: c.black,
		borderWidth: 1,
		paddingHorizontal: 3,
		marginVertical: 5,
	},
	mpaaRating: {
		fontFamily: 'Palatino',
		fontSize: 13,
		fontWeight: '500',
	},
	movieInfo: {
		flexDirection: 'row',
	},
	moviePoster: {
		overflow: 'visible',
		width: 134,
		marginRight: 10,
		shadowOpacity: 0.85,
		shadowRadius: 3,
		shadowOffset: {height: 2, width: 0},
	},
	separator: {
		marginVertical: 10,
	},
	sectionTitle: {
		fontWeight: '700',
		marginBottom: 3,
	},
	imdb: {
		color: c.infoBlue,
	},
})
