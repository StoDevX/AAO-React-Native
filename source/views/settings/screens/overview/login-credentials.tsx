import * as React from 'react'
import {Cell, Section} from '@frogpond/tableview'
import {CellTextField} from '@frogpond/tableview/cells'
import {LoginButton} from './login-button'
import {
	performLogin,
	NoCredentialsError,
	useCredentials,
	invalidateCredentials,
	storeCredentials,
	resetCredentials,
} from '../../../../lib/login'
import {TextInput} from 'react-native'
import {useMutation} from '@tanstack/react-query'
import {NoticeView} from '@frogpond/notice'
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
		mutationFn: () => resetCredentials(),
		onSuccess: async () => {
			await invalidateCredentials()
			setUsername('')
			setPassword('')
		},
	})

	if (credentials.error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={credentials.refetch}
				text={`A problem occured while loading: ${credentials.error}`}
			/>
		)
	}

	let isLoggedIn = Boolean(credentials.data)
	let hasBothCredentials = username && password

	return (
		<Section
			footer='St. Olaf login enables the "meals remaining" feature.'
			header="ST. OLAF LOGIN"
		>
			{credentials.isLoading ? (
				<Cell title="Loading…" />
			) : isLoggedIn ? (
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

			{logIn.isError && logIn.error instanceof Error && (
				<Section footer="You'll need to log in in order to see this data.">
					{logIn.error instanceof NoCredentialsError ? (
						<Cell
							cellStyle="Basic"
							title="No credentials found"
							titleTextColor={sto.red}
						/>
					) : (
						<Cell
							cellStyle="Basic"
							title={logIn.error.message}
							titleTextColor={sto.red}
						/>
					)}
				</Section>
			)}

			<LoginButton
				disabled={!hasBothCredentials || logIn.isLoading || logOut.isLoading}
				label="St. Olaf"
				loading={logIn.isLoading || logOut.isLoading}
				loggedIn={isLoggedIn}
				onPress={isLoggedIn ? logOut.mutate : logIn.mutate}
			/>
		</Section>
	)
}
