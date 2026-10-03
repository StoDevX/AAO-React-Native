import * as React from 'react'
import {StyleSheet} from 'react-native'
import {
	Form,
	Host,
	SecureField,
	Section,
	Text,
	TextField,
	type SecureFieldRef,
	type TextFieldRef,
	useNativeState,
} from '@expo/ui/swift-ui'
import {
	autocorrectionDisabled,
	disabled,
	foregroundStyle,
	onSubmit,
	submitLabel,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'
import {useMutation} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import {ActionRow} from '../../../components/rows'
import {invalidateCredentials, storeCredentials} from '../../../lib/login'
import {logIn} from '../../../lib/stoprint/api'

/**
 * Asks for a St. Olaf username and password, checks them against PaperCut, and
 * keeps them in the keychain for the rest of stoPrint to read.
 */
export function StoPrintLoginForm(): React.ReactNode {
	let [username, setUsername] = React.useState('')
	let usernameState = useNativeState('')
	let usernameInputRef = React.useRef<TextFieldRef>(null)

	let [password, setPassword] = React.useState('')
	let passwordState = useNativeState('')
	let passwordInputRef = React.useRef<SecureFieldRef>(null)

	let signIn = useMutation({
		mutationFn: async () => {
			await logIn({username, password}, {})
			try {
				await storeCredentials({username, password})
			} catch {
				throw new Error('Signed in, but could not save your login to the keychain. Try again.')
			}
		},
		onSuccess: () => invalidateCredentials(),
	})

	let canSubmit = Boolean(username && password) && !signIn.isPending

	return (
		<Host style={styles.host}>
			<Form>
				<Section
					footer={
						<Text>Sign in with your St. Olaf account to see and release your print jobs.</Text>
					}
					title="St. Olaf Login"
				>
					<TextField
						ref={usernameInputRef}
						modifiers={[
							autocorrectionDisabled(),
							textInputAutocapitalization('never'),
							submitLabel('next'),
							// the ref is read when the field is submitted, not while rendering
							// oxlint-disable-next-line react/refs
							onSubmit(() => passwordInputRef.current?.focus()),
							disabled(signIn.isPending),
						]}
						onTextChange={setUsername}
						placeholder="username"
						text={usernameState}
					/>

					<SecureField
						ref={passwordInputRef}
						modifiers={[
							submitLabel('done'),
							onSubmit(() => canSubmit && signIn.mutate()),
							disabled(signIn.isPending),
						]}
						onTextChange={setPassword}
						placeholder="password"
						text={passwordState}
					/>

					<ActionRow
						disabled={!canSubmit}
						onPress={() => signIn.mutate()}
						title={signIn.isPending ? 'Signing in to St. Olaf' : 'Sign in to St. Olaf'}
					/>

					{signIn.isError && !signIn.isPending && (
						<Text modifiers={[foregroundStyle(c.systemRed)]}>
							{signIn.error instanceof Error && signIn.error.message
								? signIn.error.message
								: 'Sign in failed. Check your username and password.'}
						</Text>
					)}
				</Section>
			</Form>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
