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
import glamorous from 'glamorous-native'
import {type TopLevelViewPropsType} from '../../types'
import {Row, Column} from '../../components/layout'
import {iOSUIKit, human, material} from 'react-native-typography'
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

function normalizeScore(score: string): ?number {
	if (score.endsWith('%')) {
		// XX%
		score = score.replace('%', '')
		return parseInt(score)
	} else if (score.includes('/')) {
		// X/10
		score = score.split('/')[0]
		return Math.round(parseFloat(score) * 10)
	}

	return null
}

function colorizeScore(score: string) {
	let numScore = normalizeScore(score)

	if (!numScore) {
		return 'black'
	}

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
		// TODO: handle "no movie posted yet this week"
		// TODO: handle all movie showing dates are past (also handle after-last-showing on last showing date)
		// TODO: show other trailers
		// TODO: differentiate between trailers, clips, teasers, and featurettes
		// TODO: group showings by date, then location; show the times for each grouped set on a card

		const mainTrailer = movie.trailers[0]
		const movieTint = makeRgb(movie.posterColors.dominant)
		const headerHeight = Math.max(Dimensions.get('window').height / 3, 200)

		WritersDirectors = () => {
			if (movie.info.Writer === movie.info.Director) {
				return (
					<React.Fragment>
						<Column marginBottom={16}>
							<Heading>Written and Directed By</Heading>
							<Text>{movie.info.Director}</Text>
						</Column>
					</React.Fragment>
				)
			}

			return (
				<React.Fragment>
					<Column marginBottom={16}>
						<Heading>Directed By</Heading>
						<Text>{movie.info.Director}</Text>
					</Column>
					<Column marginBottom={16}>
						<Heading>Written By</Heading>
						<Text>{movie.info.Writer}</Text>
					</Column>
				</React.Fragment>
			)
		}

		return (
			<ScrollView contentContainerStyle={styles.contentContainer}>
				<Header>
					<TrailerBackground
						height={headerHeight}
						tint={movieTint}
						trailer={mainTrailer}
					/>

					<Row
						alignItems="flex-end"
						bottom={0}
						justifyContent="space-between"
						left={0}
						paddingHorizontal={10}
						position="absolute"
						right={0}
					>
						<Poster
							ideal={512}
							left={0}
							sizes={movie.posters}
							tint={movieTint}
						/>

						<PlayTrailerButton
							right={40}
							tint={movieTint}
							trailer={mainTrailer}
						/>
					</Row>
				</Header>

				<MovieInfo>
					<Row>
						<Title>{movie.info.Title}</Title>
					</Row>

					<Row alignItems="center" marginBottom={16} marginTop={4}>
						<Genres genres={movie.info.Genre} />
						<Spacer />
						<ReleaseYear marginRight={4}>
							{moment(movie.info.releaseDate).format('YYYY')}
						</ReleaseYear>
						<RunTime>{movie.info.Runtime}</RunTime>
					</Row>

					<Row alignItems="center">
						<RottenTomatoesRating ratings={movie.info.Ratings} />
						<FixedSpacer/>
						<ImdbRating ratings={movie.info.Ratings} />
						<Spacer/>
						<MpaaRating rated={movie.info.Rated} />
					</Row>
				</MovieInfo>

				{/*<Showings showings={movie.showings} />*/}

				<Plot text={movie.info.Plot} />

				<PaddedCard>
					<Column marginBottom={16}>
						<Heading>Directed By</Heading>
						<Text>{movie.info.Director}</Text>
					</Column>

					<Column marginBottom={16}>
						<Heading>Written By</Heading>
						<Text>{movie.info.Writer}</Text>
					</Column>

					<Column>
						<Heading>Cast</Heading>
						<Text>{movie.info.Actors}</Text>
					</Column>
				</PaddedCard>

				<ImdbLink id={movie.info.imdbID} />

				<glamorous.View height={16} />
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
			<glamorous.Image
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
			//bottom={0}
			//left={props.left}
			//position="absolute"
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
			<glamorous.Image
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
			underlayColor={darken(0.1, tint)}
			containerStyle={{
				marginRight: right,
				backgroundColor: tint,
				borderRadius: size,
				shadowColor: setLightness(0.35, setSaturation(0.15, props.tint)),
				shadowOffset: {height: 2, width: 0},
				shadowOpacity: 0.3,
			}}
			style={{
				height: size,
				width: size,
				alignItems: 'center',
				justifyContent: 'center',
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

const Padding = glamorous.view({
	paddingHorizontal: 16,
})

const MovieInfo = glamorous(Padding)({
	marginTop: 18,
})

const Spacer = glamorous.view({flex: 1})

const FixedSpacer = glamorous.view({flexBasis: 16})

const MpaaRating = ({rated}) => (
	<glamorous.View
		//alignSelf="baseline"
		borderWidth={1}
		paddingHorizontal={4}
		paddingVertical={1}
	>
		<glamorous.Text fontFamily="Palatino" fontWeight="700" textAlign="center">
			{rated}
		</glamorous.Text>
	</glamorous.View>
)

const Title = glamorous.text({
	...Platform.select({
		ios: human.title1Object,
	}),
})

const Genres = ({genres}) => {
	return genres
		.toLowerCase()
		.split(', ')
		.map(genre => (
			<Pill key={genre} bgColorName="mediumGray" marginRight={4}>
				{genre}
			</Pill>
		))
}

const Pill = ({children, bgColorName, ...props}) => (
	<glamorous.View
		backgroundColor={c.sto[bgColorName]}
		borderRadius={50}
		{...props}
	>
		<glamorous.Text
			color={c.stoText[bgColorName]}
			fontSize={12}
			fontVariant={['small-caps']}
			paddingBottom={3}
			paddingHorizontal={8}
			paddingTop={1}
		>
			{children}
		</glamorous.Text>
	</glamorous.View>
)

const ReleaseYear = ({children, ...props}) => (
	<Pill bgColorName="blue" {...props}>
		{children}
	</Pill>
)

const RunTime = ({children, ...props}) => (
	<Pill bgColorName="lime" {...props}>
		{children}
	</Pill>
)

const Plot = ({text, ...props}: {text: string}) => {
	return (
		<Padding marginTop={16} {...props}>
			<Text>{text}</Text>
		</Padding>
	)
}

const Card = glamorous.view({
	borderRadius: 8,
	shadowRadius: 12,
	shadowOpacity: 0.2,
	shadowOffset: {height: 4, width: 4},
})

const PaddedCard = ({children}) => (
	<Card
		marginHorizontal={16}
		marginVertical={16}
		paddingHorizontal={16}
		paddingVertical={16}
	>
		{children}
	</Card>
)

const Heading = glamorous.text({...human.headlineObject})
const Text = glamorous.text({...human.bodyObject})

const ImdbRating = ({ratings}) => {
	const rating = ratings.find(r => r.Source === 'Internet Movie Database')

	if (!rating) {
		return <glamorous.Text>Unrated</glamorous.Text>
	}

	const score = normalizeScore(rating.Value)
	if (!score) {
		return <glamorous.Text>Unrated</glamorous.Text>
	}

	const tint = colorizeScore(rating.Value)

	return (
		<glamorous.Text color={tint}>
			<glamorous.Text fontSize={24} fontWeight="800">{score / 10}</glamorous.Text>
			{' ⁄ '}
			<glamorous.Text fontVariant={['small-caps']}>10</glamorous.Text>
		</glamorous.Text>
	)
}

const FullStar = () => (
	<Icon name={Platform.OS === 'ios' ? 'ios-star' : 'md-star'} size={22} />
)
const HalfStar = () => (
	<Icon
		name={Platform.OS === 'ios' ? 'ios-star-half' : 'md-star-half'}
		size={22}
	/>
)
const EmptyStar = () => (
	<Icon
		name={Platform.OS === 'ios' ? 'ios-star-outline' : 'md-star-outline'}
		size={22}
	/>
)

const RottenTomatoesRating = ({ratings}) => {
	const rating = ratings.find(r => r.Source === 'Rotten Tomatoes')

	if (!rating) {
		return <glamorous.Text>Unrated</glamorous.Text>
	}

	const score = normalizeScore(rating.Value)
	if (!score) {
		return <glamorous.Text>Unrated</glamorous.Text>
	}

	const stars = Math.round(score / 20)
	const starIcons = []
	for (let i = 0; i < 5; i++) {
		if (i < stars) {
			starIcons.push(<FullStar key={i} />)
		} else if (i === stars && i % 2 === 1) {
			starIcons.push(<HalfStar key={i} />)
		} else {
			starIcons.push(<EmptyStar key={i} />)
		}
	}

	const tint = colorizeScore(rating.Value)
	return <glamorous.Text color={tint}>{starIcons}</glamorous.Text>
}

class ImdbLink extends React.Component<{id: string}> {
	url = id => `https://www.imdb.com/title/${id}`
	open = () => openUrl(this.url(this.props.id))

	render() {
		if (!this.props.id) {
			return null
		}

		// return (
		// 	<glamorous.Text
		// 		color={c.infoBlue}
		// 		//fontVariant={['small-caps']}
		// 		onPress={this.open}
		// 	>
		// 		IMDB{' '}
		// 		<Icon name={Platform.OS === 'ios' ? 'ios-open-outline' : 'md-open'} size={16} />
		// 	</glamorous.Text>
		// )

		return (
			<glamorous.Text
				color={c.infoBlue}
				fontSize={17}
				marginLeft={16}
				onPress={this.open}
				paddingVertical={14}
			>
				Open IMDB Page
			</glamorous.Text>
		)
	}
}

const styles = StyleSheet.create({
	contentContainer: {
		backgroundColor: c.white,
	},
})
