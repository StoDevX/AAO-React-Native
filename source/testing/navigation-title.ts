import {screen, within} from '@testing-library/react-native'
import {NAVIGATION_TITLE_ID} from '../components/navigation-title'

/** The lines of the screen's two-line navigation title, the title first. */
export function navigationTitleLines(): string[] {
	return within(screen.getByTestId(NAVIGATION_TITLE_ID))
		.getAllByText(/./u)
		.map((line) => String(line.props.children))
}
