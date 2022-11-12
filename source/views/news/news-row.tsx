import * as React from 'react'
import {StyleSheet, Image, Alert} from 'react-native'
import {Column, Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'
import type {StoryType} from './types'

type Props = {
	onPress: (link: string) => void
	story: StoryType
	thumbnail: false | number
}

export const NewsRow = (props: Props): JSX.Element => {
	let _onPress = () => {
		if (!props.story.link) {
			Alert.alert('There is nowhere to go for this story')
			return
		}
		props.onPress(props.story.link)
	}

	let {story} = props

	let thumb =
		props.thumbnail !== false
			? story.featuredImage
				? {uri: story.featuredImage}
				: props.thumbnail
			: null

	return (
		<ListRow arrowPosition="top" onPress={_onPress}>
			<Row alignItems="center">
				{thumb !== null ? (
					<Image
						accessibilityIgnoresInvertColors={true}
						source={thumb}
						style={styles.image}
					/>
				) : null}
				<Column flex={1}>
					<Title lines={2}>{story.title}</Title>
					<Detail lines={3}>{story.excerpt}</Detail>
				</Column>
			</Row>
		</ListRow>
	)
}

const styles = StyleSheet.create({
	image: {
		borderRadius: 5,
		marginRight: 15,
		height: 70,
		width: 70,
	},
})
