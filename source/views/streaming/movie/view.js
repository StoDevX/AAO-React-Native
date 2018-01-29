// @flow

import * as React from 'react'
import {StyleSheet, ScrollView, Dimensions, Platform} from 'react-native'
import {connect} from 'react-redux'
import {getWeeklyMovie} from '../../../flux/parts/weekly-movie'
import {type ReduxState} from '../../../flux'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import * as c from '../../components/colors'
import moment from 'moment-timezone'
import openUrl from '../../components/open-url'
import {Column} from '../../components/layout'
import glamorous, {Image, Text} from 'glamorous-native'
import {ListRow, ListSeparator, Detail, Title} from '../../components/list'
import {type TopLevelViewPropsType} from '../../types'
import {Button} from '../../components/button'
import {
	darken,
	setSaturation,
	transparentize,
	setLightness,
	rgb,
} from 'polished'
import {Touchable} from '../../components/touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import type {
	Movie,
	MovieShowing,
	MovieRating,
	PosterInfo,
	RGBTuple,
	MovieTrailer,
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

const makeRgb = (tuple: RGBTuple) => rgb(...tuple)

export class PlainWeeklyMovieView extends React.Component<Props> {
	static navigationOptions = (...args: any) => {
		// console.log(args)
		return {
			headerTintColor: c.white,
			headerStyle: {
				backgroundColor: c.semitransparentGray,
			},
			cardStyle: {
				backgroundColor: c.white,
			},
		}
	}

	componentWillMount() {
		this.props.getWeeklyMovie()
	}

	componentWillReceiveProps(nextProps: Props) {
		const {movie: thisMovie} = this.props
		const {movie: nextMovie} = nextProps

		let oldTint = null
		let newTint = null
		if (!thisMovie && nextMovie) {
			newTint = nextMovie.posterColors.dominant
		} else if (thisMovie && !nextMovie) {
			newTint = c.white
		} else if (thisMovie && nextMovie) {
			oldTint = thisMovie.posterColors.dominant
			newTint = thisMovie.posterColors.dominant
		}

		if (oldTint !== newTint) {
			this.props.navigation.setParams({tintColor: newTint})
		}
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

		// TODO: handle view rotation
		// TODO: handle landscape
		// TODO: handle odd-shaped posters
		// TODO: style for Android

		const mainTrailer = movie.trailers[0]
		const movieTint = makeRgb(movie.posterColors.dominant)
		const headerHeight = Math.max(Dimensions.get('window').height / 3, 200)

		return (
			<ScrollView contentContainerStyle={styles.contentContainer}>
				<Header>
					<TrailerBackground
						height={headerHeight}
						tint={movieTint}
						trailer={mainTrailer}
					/>

					<PlayTrailerButton
						right={50}
						tint={movieTint}
						trailer={mainTrailer}
					/>

					<Poster
						ideal={512}
						left={10}
						sizes={movie.posters}
						tint={movieTint}
					/>
				</Header>

				{/*<MovieInfo>
					<Row>
						<MpaaRating>{movie.info.Rated}</MpaaRating>
						<Title>{movie.info.Title}</Title>
					</Row>

					<Row>
						<Genres>{movie.info.genre}</Genres>
						<Spacer />
						<ReleaseYear>{movie.info.Released}</ReleaseYear>
						<RunTime>{movie.info.Released}</RunTime>
					</Row>

					<Row>
						<FilmRatings ratings={movie.info.Ratings} />

						<ImdbLink id={movie.info.imdbID} />
					</Row>
				</MovieInfo>

				<Showings showings={movie.showings} />

				<Row>
					<Text>{movie.info.Plot}</Text>
				</Row>

				<Card>
					<Row>
						<Heading>Directed By</Heading>
						<Text>{movie.info.Director}</Text>
					</Row>

					<Row>
						<Heading>Written By</Heading>
						<Text>{movie.info.Writer}</Text>
					</Row>

					<Row>
						<Heading>Cast</Heading>
						<Text>{movie.info.Actors}</Text>
					</Row>
				</Card>*/}
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

const Header = glamorous.view({
	backgroundColor: 'gray',
	position: 'relative',
})

const TrailerBackground = (props: {
	trailer: MovieTrailer,
	tint: string,
	height: number,
}) => {
	const {trailer, tint, height} = props

	// TODO: find the largest size beneath `ideal`
	const thumbnail = trailer.thumbnails.find(thm => thm.width === 640)

	// TODO: provide a fallback image
	const uri = thumbnail ? thumbnail.url : ''

	const gradient = [
		c.transparent,
		c.transparent,
		setLightness(0.35, setSaturation(0.25, tint)),
		// darken(0.2, transparentize(0, tint)),
	]

	return (
		<glamorous.View>
			<Image
				height={height}
				resizeMode="cover"
				source={{uri}}
				width={Dimensions.get('window').width}
			/>

			<LinearGradient
				colors={gradient}
				locations={[0, 0.66, 1]}
				style={StyleSheet.absoluteFill}
			/>

			<TriangleOverlay
				height={height / 2.5}
				width={Dimensions.get('window').width}
			/>
		</glamorous.View>
	)
}

const TriangleOverlay = ({height, width}: {height: number, width: number}) => {
	return (
		<glamorous.View
			backgroundColor="transparent"
			borderBottomColor="#fff"
			borderBottomWidth={height}
			borderLeftColor="transparent"
			borderLeftWidth={0}
			borderRightColor="transparent"
			borderRightWidth={width}
			borderStyle="solid"
			bottom={0}
			height={0}
			position="absolute"
			right={0}
			width={0}
		/>
	)
}

const Poster = (props: PosterProps & {left: number}) => {
	// TODO: find way to avoid backgroundColor:transparent on wrapper
	return (
		<glamorous.View
			backgroundColor={c.transparent}
			bottom={0}
			left={props.left}
			position="absolute"
			shadowColor={setLightness(0.35, setSaturation(0.25, props.tint))}
			shadowOffset={{height: 4, width: 0}}
			shadowOpacity={0.8}
			shadowRadius={12}
		>
			<PosterImage {...props} />
		</glamorous.View>
	)
}

type PosterProps = {
	sizes: Array<PosterInfo>,
	ideal: number,
	tint: string,
}

type PosterState = {}

class PosterImage extends React.Component<PosterProps, PosterState> {
	render() {
		const {sizes, ideal, tint} = this.props

		// TODO: find the largest size beneath `ideal`
		const poster = sizes.find(p => p.width === ideal)

		// TODO: provide a fallback image
		const uri = poster ? poster.url : ''

		return (
			<Image
				accessibilityLabel="Movie Poster"
				borderRadius={8}
				// defaultSource
				height={Dimensions.get('window').width / 3 * 1.5}
				overflow="hidden"
				resizeMode="cover"
				source={{uri}}
				width={Dimensions.get('window').width / 3}
			/>
		)
	}
}

const PlayTrailerButton = (props: {
	right: number,
	tint: string,
	trailer: MovieTrailer,
}) => {
	const {right, tint, trailer} = props
	const size = 50

	return (
		<Touchable
			containerStyle={{
				position: 'absolute',
				right: right,
				bottom: 0,
				borderColor: tint,
				borderStyle: 'solid',
				borderWidth: 1,
			}}
			style={{
				alignItems: 'center',
				backgroundColor: tint,
				borderRadius: size,
				height: size,
				justifyContent: 'center',
				width: size,
				shadowColor: setLightness(0.35, setSaturation(0.15, props.tint)),
				shadowOffset: {height: 2, width: 0},
				shadowOpacity: 0.2,
			}}
		>
			<Icon
				name={Platform.OS === 'ios' ? 'ios-play' : 'md-play'}
				style={{
					color: c.white,
					fontSize: size * (3 / 5),
					textAlign: 'center',
				}}
			/>
		</Touchable>
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
		// padding: 10,
		// marginTop: -64,
		backgroundColor: c.white,
		flex: 1,
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
