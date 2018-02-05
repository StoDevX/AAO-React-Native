// @flow

import * as React from 'react'
import {StyleSheet, ScrollView, Dimensions} from 'react-native'
import {connect} from 'react-redux'
import moment from 'moment-timezone'
import glamorous from 'glamorous-native'
import {rgb} from 'polished'

import {getWeeklyMovie} from '../../../flux/parts/weekly-movie'
import {type ReduxState} from '../../../flux'
import {NoticeView} from '../../components/notice'
import LoadingView from '../../components/loading'
import * as c from '../../components/colors'
import {Row} from '../../components/layout'
import {type TopLevelViewPropsType} from '../../types'

import {Header, MovieInfo, Title, Spacer, FixedSpacer} from './components/parts'
import {Separator} from '../../components/separator'
import {Pill} from './components/pill'
import {Poster} from './components/poster'
import {TrailerBackground} from './components/trailer-background'
import {PlayTrailerButton} from './components/play-trailer-button'
import {Genres} from './components/genres'
import {
	RottenTomatoesRating,
	ImdbRating,
	MpaaRating,
} from './components/ratings.js'
import {Showings} from './components/showings'
import {Plot} from './components/plot'
import {Credits} from './components/credits'
import {ImdbLink} from './components/imdb'
import {Trailers} from './components/trailers'
import type {Movie, RGBTuple} from './types'

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

type State = {
	viewport: {
		width: number,
		height: number,
	}
}

const makeRgb = (tuple: RGBTuple) => rgb(...tuple)

export class PlainWeeklyMovieView extends React.Component<Props, State> {
	static navigationOptions = () => {
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

	state = {
		viewport: Dimensions.get('window'),
	}

	componentWillMount() {
		this.props.getWeeklyMovie()
		Dimensions.addEventListener('change', this.handleResizeEvent)
	}

	componentWillUnmount() {
		Dimensions.removeEventListener('change', this.handleResizeEvent)
	}

	handleResizeEvent = (event: {window: {width: number, height: number}}) => {
		this.setState(() => ({viewport: event.window}))
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
		// TODO: handle "no movie will show this week"
		// TODO: handle all movie showing dates are past (also handle after-last-showing on last showing date)
		// TODO: show other trailers
		// TODO: differentiate between trailers, clips, teasers, and featurettes
		// DONE: group showings by date, then location; show the times for each grouped set on a card

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

				<MovieInfo movie={movie}>
					<Title>{movie.info.Title}</Title>

					<Row alignItems="center" marginBottom={16} marginTop={4}>
						<Genres genres={movie.info.Genre} />
						<Spacer />
						<Pill bgColorName="blue" marginRight={4}>
							{moment(movie.info.releaseDate).format('YYYY')}
						</Pill>
						<Pill bgColorName="lime">{movie.info.Runtime}</Pill>
					</Row>

					<Row alignItems="center">
						<RottenTomatoesRating ratings={movie.info.Ratings} />
						<FixedSpacer />
						<ImdbRating ratings={movie.info.Ratings} />
						<Spacer />
						<MpaaRating rated={movie.info.Rated} />
					</Row>
				</MovieInfo>

				<Showings showings={movie.showings} />

				<Separator />

				<Plot text={movie.info.Plot} />

				<Credits
					actors={movie.info.Actors}
					directors={movie.info.Director}
					writers={movie.info.Writer}
				/>

				<Trailers trailers={movie.trailers} />

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

const styles = StyleSheet.create({
	contentContainer: {
		backgroundColor: c.white,
	},
})
