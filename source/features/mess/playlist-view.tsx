import * as React from 'react'
import {Linking} from 'react-native'
import {ProgressView, VStack} from '@expo/ui/swift-ui'
import {frame} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {FramedPhoto} from './image-view'
import {spotifyUrl} from './lib/spotify'
import {messPlaylistPageOptions} from './query'
import {EMBED_HEIGHT, SpotifyEmbed} from './spotify-embed'
import {SiteLinkCard, StoryBlocks} from './story-blocks'
import type {MessStory, StoryLayout} from './types'

/** Names a Playlist post's button to Spotify, for a UI test. */
export const SPOTIFY_BUTTON_ID = 'mess-playlist-spotify'

/**
 * Hands a Spotify link to iOS whatever the app's link setting, because only iOS passes a
 * universal link on to the Spotify app; the in-app sheet would keep it in a web page.
 */
function openInSpotify(url: string): Promise<void> {
	return Linking.openURL(url).catch(() => undefined)
}

type Props = {
	story: MessStory
	layout: Extract<StoryLayout, {kind: 'playlist'}>
	columnWidth: number
}

/**
 * A playlist: the post's picture, framed; a button that opens it in Spotify, and Spotify's
 * own player; then whatever the writer added. A post whose body names no playlist has its
 * web page read for one; while it is read, one placeholder holds the button's and player's
 * place, and when the page names none, or cannot be read, the post is drawn as an article
 * with a link to the page. Returned side by side, to land in the page's column.
 */
export function PlaylistView({story, layout, columnWidth}: Props): React.ReactNode {
	let page = useQuery({...messPlaylistPageOptions(story), enabled: layout.spotify === null})
	let spotify = layout.spotify ?? page.data ?? null
	// Only a body with no playlist is read from its page, so only that page can come back empty.
	let unfound = spotify === null && !page.isPending
	let photo = story.photo

	return (
		<>
			{photo ? (
				<FramedPhoto
					height={Math.round((columnWidth * photo.height) / photo.width)}
					url={photo.url}
					width={columnWidth}
				/>
			) : null}
			{spotify ? (
				<>
					<SiteLinkCard
						icon="music.note.list"
						identifier={SPOTIFY_BUTTON_ID}
						label="Open in Spotify"
						open={openInSpotify}
						prominent={true}
						url={spotifyUrl(spotify)}
					/>
					<SpotifyEmbed spotify={spotify} width={columnWidth} />
				</>
			) : unfound ? null : (
				<VStack modifiers={[frame({width: columnWidth, height: EMBED_HEIGHT})]}>
					<ProgressView />
				</VStack>
			)}
			<StoryBlocks columnWidth={columnWidth} story={story} />
			{unfound ? <SiteLinkCard icon="safari" label="Open on the Mess" url={story.link} /> : null}
		</>
	)
}
