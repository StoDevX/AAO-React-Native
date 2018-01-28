// @flow

export type RGBTuple = [number, number, number]

export type PosterInfo = {
	url: string,
	filename: string,
	width: number,
	height: number,
}

export type MovieShowing = {time: string, location: string}

export type MovieRating = {Source: string, Value: string}

export type MovieInfo = {
	Title: string,
	Year: string,
	Rated: string,
	Released: string,
	Runtime: string,
	Genre: string,
	Director: string,
	Writer: string,
	Actors: string,
	Plot: string,
	Language: string,
	Country: string,
	Awards: string,
	Ratings: Array<MovieRating>,
	Type: string,
	DVD: string,
	BoxOffice: string,
	Production: string,
	imdbID: string,
	Website: string,
}

export type Movie = {
	root: string,
	info: MovieInfo,
	showings: Array<MovieShowing>,
	posters: Array<PosterInfo>,
	posterColors: {
		dominant: RGBTuple,
		palette: Array<RGBTuple>,
	},
}
