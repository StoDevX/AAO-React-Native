// @flow

import * as React from 'react'
import {StyleSheet, ScrollView, Dimensions} from 'react-native'
import moment from 'moment-timezone'
import glamorous from 'glamorous-native'
import {rgb} from 'polished'

import {TabBarIcon} from '@frogpond/navigation-tabs'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {Row} from '@frogpond/layout'
import {openUrl} from '@frogpond/open-url'
import {ListSeparator} from '@frogpond/lists'
import {type TopLevelViewPropsType} from '../../types'

import {
	MovieInfo,
	Title,
	Spacer,
	FixedSpacer,
	FooterAction,
} from './components/parts'
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
import {fetchWeeklyMovie} from '../../../lib/movie'
import {NetInfo} from 'react-native'

type Props = TopLevelViewPropsType

type State = {
	data: ?Movie,
	message: ?string,
	error: ?string,
	loading: boolean,
	viewport: {
		width: number,
		height: number,
	},
}

const makeRgb = (tuple: RGBTuple) => rgb(...tuple)

export class WeeklyMovieView extends React.Component<Props, State> {
	static navigationOptions = () => {
		return {
			title: 'Viking Movie',
			tabBarIcon: TabBarIcon('film'),
		}
	}

	state = {
		data: null,
		message: null,
		error: null,
		loading: true,
		viewport: Dimensions.get('window'),
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})

		Dimensions.addEventListener('change', this.handleResizeEvent)
	}

	componentWillUnmount() {
		Dimensions.removeEventListener('change', this.handleResizeEvent)
	}

	fetchData = async () => {
		const online = await NetInfo.isConnected.fetch()
		const {data, message, error} = await fetchWeeklyMovie(online)

		this.setState(() => ({
			data,
			message,
			error,
		}))
	}

	handleResizeEvent = (event: {window: {width: number, height: number}}) => {
		this.setState(() => ({viewport: event.window}))
	}

	findLargestTrailerImage(data: Movie) {
		if (!data.trailers && data.trailers.size) {
			return null
		}

		const backgrounds = data.trailers
			.map(trailer => trailer.thumbnails.find(thm => thm.width === 640))
			.filter(trailer => trailer)

		return backgrounds.length ? backgrounds[0] : null
	}

	render() {
		const {data, loading, message, error} = this.state

		if (loading) {
			return <LoadingView />
		}

		if (error) {
			const msg = message || ''
			return (
				<NoticeView
					buttonText="Try Again"
					onPress={this.fetchData}
					text={`There was a problem loading the movie: ${msg}`}
				/>
			)
		}

		if (!data) {
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
		const mainTrailer = data.trailers[0]
		const largestTrailerImage = this.findLargestTrailerImage(data)
		const movieTint = makeRgb(data.poster.colors.dominant)
		const landscape = viewport.width > viewport.height
		const headerHeight = landscape
			? Math.max(viewport.height * (2 / 3), 200)
			: Math.max(viewport.height / 3, 200)
		const imdbUrl = `https://www.imdb.com/title/${data.info.imdbID}`

		return (
			<ScrollView contentContainerStyle={styles.contentContainer}>
				<TrailerBackground
					height={headerHeight}
					movie={data}
					tint={movieTint}
					trailer={largestTrailerImage}
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
						sizes={data.poster.sizes}
						tint={movieTint}
						viewport={viewport}
					/>

					<PlayTrailerButton
						right={40}
						tint={movieTint}
						trailer={mainTrailer}
					/>
				</Row>

				<MovieInfo movie={data}>
					<Title selectable={true}>{data.info.Title}</Title>

					<Row alignItems="center" marginBottom={16} marginTop={4}>
						<Genres genres={data.info.Genres} />
						<Spacer />
						<Pill bgColor={c.candyBlue} marginRight={4}>
							{moment(data.info.ReleaseDate).format('YYYY')}
						</Pill>
						<Pill bgColor={c.candyLime}>{data.info.Runtime}</Pill>
					</Row>

					<Row alignItems="center">
						<RottenTomatoesRating ratings={data.info.Ratings} />
						<FixedSpacer />
						<ImdbRating ratings={data.info.Ratings} />
						<Spacer />
						<MpaaRating rated={data.info.Rated} />
					</Row>
				</MovieInfo>

				<Showings showings={data.showings} />

				<ListSeparator />

				<Plot text={data.info.Plot} />

				<Credits
					actors={data.info.Actors}
					directors={data.info.Director}
					writers={data.info.Writer}
				/>

				<Trailers trailers={data.trailers} viewport={viewport} />

				<FooterAction onPress={() => openUrl(imdbUrl)} text="Open IMDB Page" />

				<glamorous.View height={16} />
			</ScrollView>
		)
	}
}

const styles = StyleSheet.create({
	contentContainer: {
		backgroundColor: c.white,
	},
})
