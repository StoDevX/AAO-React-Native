import * as React from 'react'
import {HangingText, VStack} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, padding} from '@expo/ui/swift-ui/modifiers'
import {runsToMarkdown} from './lib/markdown'
import {ink, messRed} from './palette'
import {BODY_ID} from './story-blocks'
import type {StoryLayout} from './types'

/** How far each indent level moves a line in, in points. */
const INDENT_STEP = 16
/** How far a line's wrapped remainder sits past its start, so it cannot pass for a new line. */
const HANGING_INDENT = 14
/** Extra space between lines, which brings body text near 1.65 line height. */
export const LINE_SPACING = 6
/** Space between stanzas, about a blank line. */
const STANZA_SPACING = 24

type PoemLayout = Extract<StoryLayout, {kind: 'poem'}>

/** A poem, line by line as the poet broke it, with a blank line between stanzas. */
export function PoemView({layout}: {layout: PoemLayout}): React.ReactNode {
	return (
		<VStack alignment="leading" spacing={STANZA_SPACING}>
			{layout.stanzas.map((stanza, stanzaIndex) => (
				// oxlint-disable-next-line react/no-array-index-key -- a poem is fixed, so its order is its identity
				<VStack alignment="leading" key={stanzaIndex} spacing={LINE_SPACING}>
					{stanza.map((line, lineIndex) => (
						<HangingText
							color={ink}
							hangingIndent={HANGING_INDENT}
							// oxlint-disable-next-line react/no-array-index-key -- a poem is fixed, so its order is its identity
							key={lineIndex}
							lineSpacing={LINE_SPACING}
							linkColor={messRed}
							modifiers={[
								padding({leading: line.indent * INDENT_STEP}),
								accessibilityIdentifier(BODY_ID),
							]}
							serif={true}
						>
							{runsToMarkdown(line.runs)}
						</HangingText>
					))}
				</VStack>
			))}
		</VStack>
	)
}
