import {GitHubHostedMenu} from '../../../source/views/menus/menu-github'

export const ThePauseMenuView = (): React.JSX.Element => (
	<GitHubHostedMenu
		loadingMessage={[
			'Mixing up a shake…',
			'Spinning up pizzas…',
			'Turning up the music…',
			'Putting ice cream on the cookies…',
			'Fixing the oven…',
		]}
		name="The Pause"
	/>
)

export default ThePauseMenuView
