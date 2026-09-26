import * as React from 'react'
import {useRouter} from 'expo-router'
import {Button, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	border,
	buttonStyle,
	contentShape,
	shadow,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {imageLabel} from './lib/byline'
import {faded} from './palette'
import {RemotePhoto} from './remote-photo'
import type {MessStory, Photo} from './types'

/** A hairline rule and a soft shadow, as a print is mounted on a page. */
const FRAMED = [border({color: faded, width: 1}), shadow({radius: 4, y: 2})]

type FramedPhotoProps = {url: string; width: number; height: number}

/** A photo in a hairline frame, lifted off the page by a soft shadow. */
export function FramedPhoto({url, width, height}: FramedPhotoProps): React.ReactNode {
	return (
		<VStack modifiers={FRAMED}>
			<RemotePhoto height={height} url={url} width={width} />
		</VStack>
	)
}

type Props = {
	story: MessStory
	image: Photo
	columnWidth: number
}

/** A comic or a piece of artwork, framed at the column's width; tapping it opens the zoom viewer. */
export function ImageView({story, image, columnWidth}: Props): React.ReactNode {
	let router = useRouter()
	let height = Math.round((columnWidth * image.height) / image.width)

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				// The images carry no alt text, so the title and writers stand in for it.
				accessibilityLabel(imageLabel(story)),
				accessibilityIdentifier('mess-story-image'),
				contentShape(shapes.rectangle()),
			]}
			onPress={() =>
				router.navigate({pathname: '/Messenger/image', params: {id: String(story.id)}})
			}
		>
			<FramedPhoto height={height} url={image.url} width={columnWidth} />
		</Button>
	)
}
