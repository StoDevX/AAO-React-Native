import * as React from 'react'
import {
	SecureField,
	Section,
	Text,
	TextField,
	type SecureFieldRef,
	type TextFieldRef,
	useNativeState,
} from '@expo/ui/swift-ui'
import {
	disabled,
	foregroundColor,
	onSubmit,
	submitLabel,
} from '@expo/ui/swift-ui/modifiers'
import {
	performLogin,
	credentialsOptions,
	invalidateCredentials,
	storeCredentials,
	resetCredentials,
} from '../../../../lib/login'
import {useMutation, useQuery} from '@tanstack/react-query'
import {sto} from '../../../../lib/colors'
import {ActionRow} from '../../components/rows'

function LoginButton(props: {
	loading: boolean
	disabled?: boolean
	loggedIn: boolean
	onPress: () => void
	label: string
}): React.ReactNode {
	let {loading, disabled, loggedIn, onPress, label} = props

	let message
	if (loading) {
		message = loggedIn ? `Signing out of ${label}` : `Signing in to ${label}`
	} else {
		message = loggedIn ? `Sign out of ${label}` : `Sign in to ${label}`
	}

	return (
		<ActionRow
			disabled={loading || disabled}
			onPress={onPress}
			title={message}
		/>
	)
}

export const CredentialsLoginSection = (): React.ReactNode => {
	let [username, setUsername] = React.useState('')
	let usernameState = useNativeState('')
	let usernameInputRef = React.useRef<TextFieldRef>(null)

	let [password, setPassword] = React.useState('')
	let passwordState = useNativeState('')
	let passwordInputRef = React.useRef<SecureFieldRef>(null)

	let credentials = useQuery(credentialsOptions)

	React.useEffect(() => {
		if (credentials.data) {
			setUsername(credentials.data.username)
			usernameState.set(credentials.data.username)
			setPassword(credentials.data.password)
			passwordState.set(credentials.data.password)
		}
		// usernameState/passwordState are stable for the component's lifetime
		// (useNativeState captures its initial value once); only credentials.data
		// should re-trigger this.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [credentials.data])

	let logIn = useMutation({
		mutationFn: () => performLogin({username, password}),
		onSuccess: async (credentialsToStore) => {
			await storeCredentials(credentialsToStore)
			await invalidateCredentials()
		},
	})

	let logOut = useMutation({
		mutationFn: resetCredentials,
		onSuccess: async () => {
			await invalidateCredentials()
			setUsername('')
			usernameState.set('')
			setPassword('')
			passwordState.set('')
		},
	})

	let isLoggedIn = Boolean(credentials.data)
	let hasBothCredentials = Boolean(username && password)

	let sectionFooter = isLoggedIn
		? 'St. Olaf login enables the "meals remaining" feature.'
		: 'St. Olaf login enables the "meals remaining" feature. Sign in to see this data.'

	let actionPending = logIn.isPending || logOut.isPending

	return (
		<Section footer={<Text>{sectionFooter}</Text>} title="St. Olaf Login">
			{isLoggedIn ? (
				<Text>{`Logged in as ${username}.`}</Text>
			) : (
				<>
					<TextField
						ref={usernameInputRef}
						modifiers={[
							submitLabel('next'),
							onSubmit(() => passwordInputRef.current?.focus()),
							disabled(actionPending),
						]}
						onTextChange={setUsername}
						placeholder="username"
						text={usernameState}
					/>

					<SecureField
						ref={passwordInputRef}
						modifiers={[
							submitLabel('done'),
							onSubmit(() => logIn.mutate()),
							disabled(actionPending),
						]}
						onTextChange={setPassword}
						placeholder="password"
						text={passwordState}
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
				<Text modifiers={[foregroundColor(sto.red)]}>
					{logIn.error.message}
				</Text>
			)}
		</Section>
	)
}
