import {BonAppHostedMenu} from '../../../source/views/menus/menu-bonapp'

export const TheCageMenuView = (): React.JSX.Element => (
	<BonAppHostedMenu
		cafe="the-cage"
		ignoreProvidedMenus={true}
		loadingMessage={[
			'Checking for vegan cookies…',
			'Serving up some shakes…',
			'Waiting for menu screens to change…',
			'Frying chicken…',
			'Brewing coffee…',
		]}
		name="The Cage"
	/>
)

export default TheCageMenuView
