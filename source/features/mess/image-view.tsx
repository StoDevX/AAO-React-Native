import * as React from 'react'
import {useRouter} from 'expo-router'
import {Button, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	border,
	buttonStyle,
	contentShape,
	shadow,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {imageLabel, picturePlace} from './lib/byline'
import {faded, printShadow} from './palette'
import {usePaper} from './paper-context'
import {RemotePhoto} from './remote-photo'
import type {MessStory, Photo} from './types'

/** A hairline rule and a soft shadow, as a print is mounted on a page. */
const FRAMED = [border({color: faded, width: 1}), shadow({color: printShadow, radius: 4, y: 2})]

type FramedPhotoProps = {url: string; width: number; height: number}

/** A photo in a hairline frame, lifted off the page by a soft shadow. */
export function FramedPhoto({url, width, height}: FramedPhotoProps): React.ReactNode {
	return (
		<VStack modifiers={FRAMED}>
			<RemotePhoto height={height} url={url} width={width} />
		</VStack>
	)
}

type ViewerButtonProps = {
	/** What VoiceOver reads for the picture */
	label: string
	/** Names the button for a UI test */
	identifier: string
	/** The viewer's route params, which say which picture it shows */
	params: {id: string; index?: string; url?: string}
	children: React.ReactElement
}

/** A picture as a button, read as an image, that opens it in the zoom viewer. */
export function ViewerButton({
	label,
	identifier,
	params,
	children,
}: ViewerButtonProps): React.ReactNode {
	let router = useRouter()
	let {routes} = usePaper()
	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(label),
				accessibilityAddTraits(['isImage']),
				accessibilityIdentifier(identifier),
				contentShape(shapes.rectangle()),
			]}
			onPress={() => router.navigate({pathname: routes.image, params})}
		>
			{children}
		</Button>
	)
}

type Props = {
	story: MessStory
	image: Photo
	columnWidth: number
	/** Which of a feature page's pictures this is, for the viewer to open at; none for a comic's or artwork's one picture */
	index?: number
}

/** A comic, a piece of artwork or a feature page's picture, framed at the column's width; tapping it opens the zoom viewer. */
export function ImageView({story, image, columnWidth, index}: Props): React.ReactNode {
	let height = Math.round((columnWidth * image.height) / image.width)

	return (
		<ViewerButton
			identifier="mess-story-image"
			// The images carry no alt text, so the title and writers stand in for it.
			label={imageLabel(story, picturePlace(story, index))}
			params={
				index === undefined ? {id: String(story.id)} : {id: String(story.id), index: String(index)}
			}
		>
			<FramedPhoto height={height} url={image.url} width={columnWidth} />
		</ViewerButton>
	)
}
