import {BonAppHostedMenu} from '../../../source/views/menus/menu-bonapp'

const StavHallMenuView = (): React.JSX.Element => (
	<BonAppHostedMenu
		cafe="stav-hall"
		loadingMessage={[
			'Hunting Ferndale Turkey…',
			'Tracking wild vegan burgers…',
			'"Cooking" some lutefisk…',
			'Finding more mugs…',
			'Waiting for omelets…',
			'Putting out more cookies…',
		]}
		name="Stav Hall"
	/>
)

export default StavHallMenuView
