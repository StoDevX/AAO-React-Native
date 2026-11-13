@file:OptIn(ExperimentalComposeUiApi::class)

package tech.frogpond.placecardheader

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

/**
 * The caller's header buttons: Material's 48dp touch target, and the gap
 * between a button and the title. The buttons are not drawn here; the caller
 * layers its own over this view's top corners.
 */
internal val ButtonSize = 48.dp
private val ButtonGap = 12.dp

/** How far the title sits in from the trailing edge, clear of the close button. */
private val TitleInset = ButtonSize + ButtonGap

/** How far the title sits in from the leading edge: Material's 24dp sheet margin. */
private val StartInset = 24.dp

/** The title's top sits this far below the buttons' top when a subtitle follows. */
private val TitleTopOffset = 2.dp

@OptimizedComposeProps
data class PlaceCardHeaderProps(
  val title: String = "",
  val subtitle: String? = null,
  /** iOS's: where a long name may scroll. Android wraps a long name instead, so it is unused. */
  val animate: Boolean? = null,
  /** True where the card shows its name some other way: no space, nothing drawn, still mounted. */
  val hidden: Boolean? = null,
  val testID: String? = null
) : ComposeProps

/**
 * A place card's title and subtitle, as Google Maps sets a place's: at the
 * start, the name wrapping to a second line rather than scrolling, clear of
 * the caller's close button at the trailing edge.
 *
 * TalkBack reads one heading: the whole title, then the subtitle, however
 * much of either is on screen.
 */
@Composable
fun FunctionalComposableScope.PlaceCardHeaderContent(props: PlaceCardHeaderProps) {
  val hidden = props.hidden == true
  val subtitle = props.subtitle?.takeIf { it.isNotEmpty() }
  val label = listOfNotNull(props.title.takeIf { it.isNotEmpty() }, subtitle).joinToString(", ")
  val testID = props.testID

  Box(
    modifier = Modifier
      .fillMaxWidth()
      .then(if (hidden) Modifier.height(0.dp) else Modifier)
      .clipToBounds()
      .alpha(if (hidden) 0f else 1f)
      // One element for the whole header, not the marquee's moving copies.
      .clearAndSetSemantics {
        if (!hidden) {
          contentDescription = label
          heading()
          if (!testID.isNullOrEmpty()) {
            testTag = testID
            testTagsAsResourceId = true
          }
        }
      }
  ) {
    // Google Maps' place sheet: the name at the start, wrapping to a second
    // line rather than scrolling, the subtitle under it, and room at the
    // trailing edge for the close button the caller lays over this view.
    Column(
      horizontalAlignment = Alignment.Start,
      verticalArrangement = if (subtitle == null) Arrangement.Center else Arrangement.Top,
      modifier = Modifier
        .fillMaxWidth()
        .padding(start = StartInset, end = TitleInset)
        .then(
          if (subtitle == null) {
            Modifier.heightIn(min = ButtonSize)
          } else {
            Modifier.padding(top = TitleTopOffset)
          }
        )
    ) {
      Text(
        text = props.title,
        style = MaterialTheme.typography.headlineSmall,
        color = LocalContentColor.current,
        maxLines = 2,
        overflow = TextOverflow.Ellipsis
      )
      if (subtitle != null) {
        Text(
          text = subtitle,
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
          maxLines = 1,
          overflow = TextOverflow.Ellipsis
        )
      }
    }
  }
}
