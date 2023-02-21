import * as React from 'react'
import {Cell, Section} from '@frogpond/tableview'
import {CellTextField} from '@frogpond/tableview/cells'
import {LoginButton} from './login-button'
import {
	performLogin,
	useCredentials,
	invalidateCredentials,
	storeCredentials,
	resetCredentials,
} from '../../../../lib/login'
import {TextInput} from 'react-native'
import {useMutation} from '@tanstack/react-query'
import {sto} from '../../../../lib/colors'

export const CredentialsLoginSection = (): JSX.Element => {
	let [username, setUsername] = React.useState('')
	let usernameInputRef = React.useRef<TextInput>(null)

	let [password, setPassword] = React.useState('')
	let passwordInputRef = React.useRef<TextInput>(null)

	let credentials = useCredentials({
		onSuccess: (data) => {
			if (!data) {
				return
			}

			setUsername(data.username)
			setPassword(data.password)
		},
	})

	let logIn = useMutation({
		mutationFn: () => performLogin({username, password}),
		onSuccess: async (credentials) => {
			await storeCredentials(credentials)
			await invalidateCredentials()
		},
	})

	let logOut = useMutation({
		mutationFn: resetCredentials,
		onSuccess: async () => {
			await invalidateCredentials()
			setUsername('')
			setPassword('')
		},
	})

	let isLoggedIn = Boolean(credentials.data)
	let hasBothCredentials = Boolean(username && password)

	let sectionFooter = isLoggedIn
		? 'St. Olaf login enables the "meals remaining" feature.'
		: 'St. Olaf login enables the "meals remaining" feature. Sign in to see this data.'

	let actionPending = logIn.isLoading || logOut.isLoading

	return (
		<Section footer={sectionFooter} header="ST. OLAF LOGIN">
			<>
				{isLoggedIn ? (
					<Cell title={`Logged in as ${username}.`} />
				) : (
					<>
						<CellTextField
							ref={usernameInputRef}
							editable={!logIn.isLoading}
							label="Username"
							onChangeText={(text) => setUsername(text)}
							onSubmitEditing={() => passwordInputRef.current?.focus()}
							placeholder="username"
							returnKeyType="next"
							secureTextEntry={false}
							value={username}
						/>

						<CellTextField
							ref={passwordInputRef}
							editable={!logIn.isLoading}
							label="Password"
							onChangeText={(text) => setPassword(text)}
							onSubmitEditing={() => logIn.mutate()}
							placeholder="password"
							returnKeyType="done"
							secureTextEntry={true}
							value={password}
						/>
					</>
				)}

				<LoginButton
					disabled={!hasBothCredentials || actionPending}
					label="St. Olaf"
					loading={actionPending}
					loggedIn={isLoggedIn}
					onPress={isLoggedIn ? logOut.mutate : logIn.mutate}
				/>

				{!actionPending && logIn.isError && logIn.error instanceof Error && (
					<Cell
						cellStyle="Basic"
						title={logIn.error.message}
						titleTextColor={sto.red}
					/>
				)}
			</>
		</Section>
	)
}
