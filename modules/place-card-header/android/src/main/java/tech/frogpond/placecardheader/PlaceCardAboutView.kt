@file:OptIn(ExperimentalComposeUiApi::class)

package tech.frogpond.placecardheader

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

/** The About text is clamped to its first five lines, as Maps clamps it. */
private const val ClampedLines = 5

/** Space between the ellipsis and the More label. */
private val MoreGap = 12.dp

private const val MoreLabel = "More"

@OptimizedComposeProps
data class PlaceCardAboutProps(
  val text: String = "",
  val testID: String? = null
) : ComposeProps

/**
 * A place card's About text: the first five lines, the last of them cut short
 * with an ellipsis, and More at its trailing end when there is more to read.
 * A tap shows the rest in place, where it can be selected.
 *
 * The fifth line is cut back by measuring with the same text measurer the
 * text is drawn with, so More never overlaps the words before it.
 */
@Composable
fun FunctionalComposableScope.PlaceCardAboutContent(props: PlaceCardAboutProps) {
  val text = props.text
  var expanded by remember(text) { mutableStateOf(false) }
  val style = MaterialTheme.typography.bodyLarge.copy(color = LocalContentColor.current)
  val moreStyle = style.copy(fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
  val measurer = rememberTextMeasurer()
  val density = LocalDensity.current
  val testID = props.testID

  BoxWithConstraints(
    modifier = Modifier
      .fillMaxWidth()
      .animateContentSize()
  ) {
    val width = if (constraints.hasBoundedWidth) constraints.maxWidth else 0
    val shortened = remember(text, width, style, moreStyle, expanded) {
      if (expanded || width <= 0) {
        null
      } else {
        val reserve = measurer.measure(text = MoreLabel, style = moreStyle, softWrap = false, maxLines = 1).size.width +
          with(density) { MoreGap.toPx() }
        shortenedText(text, width, measurer, style, reserve)
      }
    }

    if (expanded) {
      // Selectable only once expanded: cut short, a copy would hold only the
      // lines on screen.
      SelectionContainer(
        modifier = Modifier
          .fillMaxWidth()
          .semantics {
            if (!testID.isNullOrEmpty()) {
              testTag = testID
              testTagsAsResourceId = true
            }
          }
      ) {
        Text(text = text, style = style)
      }
    } else {
      val truncated = shortened != null
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .pointerInput(truncated) {
            if (truncated) {
              detectTapGestures { expanded = true }
            }
          }
          // TalkBack reads the whole text either way; while it is cut short
          // on screen, a double tap shows the rest.
          .clearAndSetSemantics {
            contentDescription = text
            if (truncated) {
              onClick(label = "Show more") {
                expanded = true
                true
              }
            }
            if (!testID.isNullOrEmpty()) {
              testTag = testID
              testTagsAsResourceId = true
            }
          }
      ) {
        Text(
          text = shortened ?: text,
          style = style,
          // A backstop for the frame before the width is known.
          maxLines = ClampedLines,
          overflow = TextOverflow.Ellipsis,
          modifier = Modifier.fillMaxWidth()
        )
        if (truncated) {
          Text(
            text = MoreLabel,
            style = moreStyle,
            maxLines = 1,
            modifier = Modifier.align(Alignment.BottomEnd)
          )
        }
      }
    }
  }
}

/**
 * `text` as its first five lines at `width`, the fifth cut back a word at a
 * time until it and an ellipsis leave `reserve` pixels free at its end; null
 * when the text fits in five lines as it is.
 */
private fun shortenedText(
  text: String,
  width: Int,
  measurer: TextMeasurer,
  style: TextStyle,
  reserve: Float
): String? {
  val layout = measurer.measure(text = text, style = style, constraints = Constraints(maxWidth = width))
  if (layout.lineCount <= ClampedLines) {
    return null
  }

  val lastStart = layout.getLineStart(ClampedLines - 1)
  val nextStart = layout.getLineStart(ClampedLines)
  val head = text.substring(0, lastStart)
  var last = text.substring(lastStart, nextStart)

  val room = width - reserve
  fun trimmed(line: String): String = line.trimEnd { it.isWhitespace() || it == ',' || it == ';' || it == ':' }
  fun fits(line: String): Boolean =
    measurer.measure(text = trimmed(line) + "…", style = style, softWrap = false, maxLines = 1).size.width <= room

  while (last.isNotEmpty() && !fits(last)) {
    // Back a word at a time; a single word too long for the line goes back a
    // character at a time instead.
    val words = trimmed(last)
    val space = words.indexOfLast { it == ' ' || it == '\t' }
    last = if (space >= 0) words.substring(0, space) else words.dropLast(1)
  }
  // A hard break before the last line: cut short, it could otherwise fit
  // back on the line above and leave More over that line's end.
  return head.trim() + "\n" + trimmed(last) + "…"
}
