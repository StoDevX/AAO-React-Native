import React from 'react'
import {ScrollView, StyleSheet} from 'react-native'

import * as c from '@frogpond/colors'
import * as m from '@frogpond/markdown'

const styles = StyleSheet.create({
	scroll: {
		backgroundColor: c.systemBackground,
		paddingHorizontal: 15,
		paddingVertical: 15,
	},
})

export let LegalView = (): JSX.Element => (
	<ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scroll}>
		<m.Heading level={2}>The MIT License (MIT)</m.Heading>

		<m.Paragraph>Copyright (c) 2018 StoDevX</m.Paragraph>

		<m.Paragraph>
			Permission is hereby granted, free of charge, to any person obtaining a
			copy of this software and associated documentation files (the “Software”),
			to deal in the Software without restriction, including without limitation
			the rights to use, copy, modify, merge, publish, distribute, sublicense,
			and/or sell copies of the Software, and to permit persons to whom the
			Software is furnished to do so, subject to the following conditions:
		</m.Paragraph>

		<m.Paragraph>
			The above copyright notice and this permission notice shall be included in
			all copies or substantial portions of the Software.
		</m.Paragraph>

		<m.Paragraph>
			THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
			IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
			FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
			THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
			LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
			FROM OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
			DEALINGS IN THE SOFTWARE.
		</m.Paragraph>

		<m.Paragraph>
			This software is in no way supported by or sponsored by St. Olaf College.
		</m.Paragraph>

		<m.Paragraph>
			Google Play and the Google Play logo are trademarks of Google LLC.
		</m.Paragraph>

		<m.Paragraph>
			Apple, the Apple logo, iPhone, and iPad are trademarks of Apple Inc.,
			registered in the U.S. and other countries. App Store is a service mark of
			Apple Inc., registered in the U.S. and other countries.
		</m.Paragraph>
	</ScrollView>
)
