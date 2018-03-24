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
import openUrl from '../../components/open-url'
import {type TopLevelViewPropsType} from '../../types'

import {
	MovieInfo,
	Title,
	Spacer,
	FixedSpacer,
	FooterAction,
} from './components/parts'
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
	},
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

		// TODO: handle odd-shaped posters
		// TODO: style for Android
		// TODO: handle "no movie posted yet this week"
		// TODO: handle "no movie will show this week"
		// TODO: handle all movie showing dates are past
		// TODO: also handle after-last-showing on last showing date
		// TODO: remove the Play button
		// TODO: handle multiple movies on one weekend

		const viewport = this.state.viewport
		const mainTrailer = movie.trailers[0]
		const movieTint = makeRgb(movie.poster.colors.dominant)
		const landscape = viewport.width > viewport.height
		const headerHeight = landscape
			? Math.max(viewport.height * (2 / 3), 200)
			: Math.max(viewport.height / 3, 200)
		const imdbUrl = `https://www.imdb.com/title/${movie.info.imdbID}`

		return (
			<ScrollView
				contentContainerStyle={styles.contentContainer}
			>
				<TrailerBackground
					height={headerHeight}
					tint={movieTint}
					trailer={mainTrailer}
					viewport={viewport}
				/>

				<Row
					alignItems="flex-end"
					justifyContent="space-between"
					minHeight={headerHeight}
					paddingHorizontal={10}
				>
					<Poster
						ideal={512}
						left={0}
						onPress={() => openUrl(imdbUrl)}
						sizes={movie.poster.sizes}
						tint={movieTint}
						viewport={viewport}
					/>

					<PlayTrailerButton
						right={40}
						tint={movieTint}
						trailer={mainTrailer}
					/>
				</Row>

				<MovieInfo movie={movie}>
					<Title selectable={true}>{movie.info.Title}</Title>

					<Row alignItems="center" marginBottom={16} marginTop={4}>
						<Genres genres={movie.info.Genres} />
						<Spacer />
						<Pill bgColorName="blue" marginRight={4}>
							{moment(movie.info.ReleaseDate).format('YYYY')}
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

				<Trailers trailers={movie.trailers} viewport={viewport} />

				<FooterAction onPress={() => openUrl(imdbUrl)} text="Open IMDB Page" />

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
