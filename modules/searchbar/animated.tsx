import * as React from 'react'

import {StyleSheet, Animated, useWindowDimensions} from 'react-native'
import {white} from '@frogpond/colors'
import {SearchBar} from './searchbar'
import {AnimatedValueType} from './types'

type Props = {
	value: string
	active: boolean
	placeholder?: string
	onSubmit?: () => unknown
	onFocus?: () => unknown
	onCancel?: () => unknown
	onChange?: (value: string) => unknown
	title?: string
}

export let AnimatedSearchBar = (props: Props): JSX.Element => {
	let viewport = useWindowDimensions()

	let headerOpacitySpec: AnimatedValueType = React.useMemo(() => {
		return {start: 1, end: 0, duration: 200}
	}, [])

	let searchBarTopSpec: AnimatedValueType = React.useMemo(() => {
		return {start: 71, end: 10, duration: 200}
	}, [])

	let containerHeightSpec: AnimatedValueType = React.useMemo(() => {
		return {start: 125, end: 64, duration: 200}
	}, [])

	let headerOpacity = React.useMemo(() => {
		return new Animated.Value(headerOpacitySpec.start)
	}, [headerOpacitySpec.start])

	let searchBarTop = React.useMemo(() => {
		return new Animated.Value(searchBarTopSpec.start)
	}, [searchBarTopSpec.start])

	let containerHeight = React.useMemo(() => {
		return new Animated.Value(containerHeightSpec.start)
	}, [containerHeightSpec.start])

	let animate = (
		thing: Animated.Value,
		args: {start: number; end: number; duration: number},
		toValue: 'start' | 'end',
	) => {
		Animated.timing(thing, {
			toValue: args[toValue],
			duration: args.duration,
			useNativeDriver: false,
		}).start()
	}

	let activateSearch = React.useCallback(() => {
		animate(headerOpacity, headerOpacitySpec, 'end')
		animate(searchBarTop, searchBarTopSpec, 'end')
		animate(containerHeight, containerHeightSpec, 'end')
	}, [
		containerHeight,
		containerHeightSpec,
		headerOpacity,
		headerOpacitySpec,
		searchBarTop,
		searchBarTopSpec,
	])

	let deactivateSearch = React.useCallback(() => {
		animate(headerOpacity, headerOpacitySpec, 'start')
		animate(searchBarTop, searchBarTopSpec, 'start')
		animate(containerHeight, containerHeightSpec, 'start')
	}, [
		containerHeight,
		containerHeightSpec,
		headerOpacity,
		headerOpacitySpec,
		searchBarTop,
		searchBarTopSpec,
	])

	React.useEffect(() => {
		props.active ? activateSearch() : deactivateSearch()
	}, [activateSearch, deactivateSearch, props.active])

	let handleFocus = () => {
		activateSearch()
		props.onFocus && props.onFocus()
	}

	let handleCancel = () => {
		deactivateSearch()
		props.onCancel && props.onCancel()
	}

	let searchBarWidth = viewport.width - 20

	let showTitle = Boolean(props.title)

	let containerStyle = [
		styles.searchContainer,
		styles.common,
		{
			height: showTitle ? containerHeight : containerHeightSpec.end,
		},
	]

	let searchStyle = [
		styles.searchBarWrapper,
		{width: searchBarWidth},
		{top: showTitle ? searchBarTop : searchBarTopSpec.end},
	]

	let headerStyle = [
		styles.header,
		{
			opacity: showTitle ? headerOpacity : headerOpacitySpec.end,
		},
	]

	return (
		<Animated.View style={containerStyle}>
			{showTitle ? (
				<Animated.Text style={headerStyle}>{props.title}</Animated.Text>
			) : null}

			<Animated.View style={searchStyle}>
				<SearchBar
					active={props.active}
					backButtonAndroid="search"
					onCancel={handleCancel}
					onChange={props.onChange}
					onFocus={handleFocus}
					onSubmit={props.onSubmit}
					placeholder={props.placeholder}
					value={props.value}
				/>
			</Animated.View>
		</Animated.View>
	)
}

let styles = StyleSheet.create({
	common: {
		backgroundColor: white,
	},
	searchContainer: {
		margin: 0,
	},
	searchBarWrapper: {
		position: 'absolute',
		left: 10,
	},
	header: {
		fontSize: 30,
		fontWeight: 'bold',
		padding: 22,
		paddingLeft: 17,
	},
})
