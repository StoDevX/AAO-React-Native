import * as React from 'react'
import {requireNativeView} from 'expo'

export type PlaceCardHeaderProps = {
	title: string
	/// Under the title, one line. None draws none.
	subtitle: string | null
	/// True at the sheet stops where Apple Maps lets a long title move. A title
	/// that fits never moves, whatever this says.
	animate: boolean
	/// True where the card shows its name some other way. The header takes no
	/// space and draws nothing, but stays mounted so its marquee keeps time.
	hidden?: boolean
	testID?: string
}

const PlaceCardHeaderNativeView: React.ComponentType<PlaceCardHeaderProps> = requireNativeView(
	'PlaceCardHeader',
	'PlaceCardHeaderView',
)

/// Apple Maps' place-card title and subtitle as SwiftUI content, for sheets
/// built with `@expo/ui`. It leaves room for 44pt buttons at its top corners
/// and draws none: the caller layers its own over it. Renders only inside a
/// `Host`: it is a SwiftUI view, not a React Native one.
export function PlaceCardHeader(props: PlaceCardHeaderProps): React.ReactNode {
	return <PlaceCardHeaderNativeView {...props} />
}

export type PlaceCardScaffoldProps = {
	/// Exactly two: the header, then the list it sits over.
	children: [React.ReactNode, React.ReactNode]
	/// True at the sheet's large stop, where the list's first row sits
	/// straight against the header.
	large: boolean
}

const PlaceCardScaffoldNativeView: React.ComponentType<{
	children: React.ReactNode
	large: boolean
}> = requireNativeView('PlaceCardHeader', 'PlaceCardScaffoldView')

/// A place card's header pinned over its list, as Apple Maps pins one: the
/// list scrolls beneath the header, blurred there, with a crisp edge at the
/// header's bottom. Renders only inside a `Host`.
export function PlaceCardScaffold({children, large}: PlaceCardScaffoldProps): React.ReactNode {
	return <PlaceCardScaffoldNativeView large={large}>{children}</PlaceCardScaffoldNativeView>
}

export type PlaceCardAboutProps = {
	text: string
	testID?: string
}

const PlaceCardAboutNativeView: React.ComponentType<PlaceCardAboutProps> = requireNativeView(
	'PlaceCardHeader',
	'PlaceCardAboutView',
)

/// A place card's About text as Apple Maps sets it: five lines, then MORE,
/// which shows the rest in place. Renders only inside a `Host`.
export function PlaceCardAbout(props: PlaceCardAboutProps): React.ReactNode {
	return <PlaceCardAboutNativeView {...props} />
}
