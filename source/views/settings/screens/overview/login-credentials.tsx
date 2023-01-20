import * as React from 'react'
import {Cell, Section} from '@frogpond/tableview'
import {CellTextField} from '@frogpond/tableview/cells'
import {LoginButton} from './login-button'
import {
	performLogin,
	SIS_LOGIN_KEY,
	NoCredentialsError,
} from '../../../../lib/login'
import {TextInput} from 'react-native'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {NoticeView} from '@frogpond/notice'
import {
	getInternetCredentials,
	resetInternetCredentials,
	setInternetCredentials,
} from 'react-native-keychain'
import {sto} from '../../../../lib/colors'

const keys = {
	default: ['credentials'],
}

export const CredentialsLoginSection = (): JSX.Element => {
	const queryClient = useQueryClient()

	let [username, setUsername] = React.useState('')
	let usernameInputRef = React.useRef<TextInput>(null)

	let [password, setPassword] = React.useState('')
	let passwordInputRef = React.useRef<TextInput>(null)

	let credentials = useQuery({
		queryKey: keys.default,
		queryFn: () => getInternetCredentials(SIS_LOGIN_KEY),
		onSuccess: (data) => {
			if (!data) {
				return
			}

			setUsername(data.username ?? '')
			setPassword(data.password ?? '')
		},
		networkMode: 'always',
		cacheTime: 0,
		staleTime: 0,
	})

	let logIn = useMutation({
		mutationFn: () => performLogin({username, password}),
		onSuccess: async (credentials) => {
			await setInternetCredentials(
				SIS_LOGIN_KEY,
				credentials.username,
				credentials.password,
			)
			queryClient.invalidateQueries({queryKey: keys.default})
		},
	})

	let logOut = useMutation({
		mutationFn: () => resetInternetCredentials(SIS_LOGIN_KEY),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: keys.default})
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
