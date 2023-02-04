import * as ImagePicker from 'react-native-image-picker'
import {
	useMutation,
	UseMutationResult,
	useQuery,
	UseQueryResult,
} from '@tanstack/react-query'
import * as storage from '../../lib/storage'
import {queryClient} from '../../init/tanstack-query'

export class ImagePickerError extends Error {}

export const keys = {
	background: ['settings', 'background'] as const,
}

async function chooseBackgroundImage(): Promise<string | undefined> {
	const {assets, didCancel, errorCode, errorMessage} =
		await ImagePicker.launchImageLibrary({mediaType: 'photo'})

	if (errorCode || errorMessage) {
		throw new ImagePickerError()
	}

	let imagePath = assets && assets[0].uri

	if (didCancel || imagePath === undefined || !imagePath.length) {
		return undefined
	}

	return imagePath
}

type AppBackgroundMutation = UseMutationResult<
	string | undefined,
	unknown,
	void,
	unknown
>

export const useUpdateAppBackground = (): AppBackgroundMutation => {
	return useMutation({
		mutationFn: chooseBackgroundImage,
		onSuccess: async (imagePath) => {
			if (imagePath === undefined) {
				return
			}

			await storage.setBackgroundPreference(imagePath)
			queryClient.invalidateQueries({queryKey: keys.background})
		},
	})
}

export function useAppBackground(): UseQueryResult<string, unknown> {
	return useQuery({
		queryKey: keys.background,
		queryFn: () => storage.getBackgroundPreference(),
	})
}
