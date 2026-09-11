import * as React from 'react'
import {Stack} from 'expo-router'

/**
 * The contact sheet's own navigation stack, holding the header the sheet
 * draws its title in.
 *
 * The presenting stack can draw that header itself, and the route turns it off
 * (`headerShown: false`) rather than use it. A large title there is
 * translucent with no opaque backing of its own, so inside a formSheet its
 * blur samples through the whole sheet and paints the colours of whatever sits
 * behind it — on this route, the contact grid's tiles, as four blurred blobs
 * across the title. A header inside the sheet has a background to sit on and
 * does not.
 *
 * `Campus/detail` and `Dictionary/entry` both nest a stack for a second
 * reason this route does not share: a screen pushed while the sheet is up
 * needs somewhere to get a back button. Nothing pushes from a contact.
 */
export default function DirectoryNamedLayout(): React.ReactNode {
	return <Stack />
}
