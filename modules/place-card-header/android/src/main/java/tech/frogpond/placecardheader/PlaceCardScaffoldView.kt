package tech.frogpond.placecardheader

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

/** The divider under the header, Material's 1dp outline-variant rule. */
private val EdgeThickness = 1.dp

@OptimizedComposeProps
data class PlaceCardScaffoldProps(
  /**
   * True at the sheet's large stop. On iOS the list's first row is pulled up
   * under the header's frosted edge there; here nothing scrolls beneath the
   * header, so the list already sits straight against it and this needs no
   * layout of its own.
   */
  val large: Boolean? = null
) : ComposeProps

/**
 * A place card's header pinned over its list. The header takes its own
 * height at the top of the space the sheet offers and the list fills the
 * rest, so at a short stop with large text the list shrinks rather than the
 * header being pushed out of view.
 *
 * Material's pinned top-bar treatment stands in for Maps' frosted edge:
 * nothing at rest, and a hairline divider under the header once any of the
 * list has scrolled away beneath it.
 *
 * Takes exactly two children, the header and then the list.
 */
@Composable
fun FunctionalComposableScope.PlaceCardScaffoldContent(props: PlaceCardScaffoldProps) {
  // How far the list has scrolled from its top, summed from what it reports
  // consuming. A lazy list reports every drag and fling through nested scroll.
  var scrollOffset by remember { mutableFloatStateOf(0f) }
  val connection = remember {
    object : NestedScrollConnection {
      override fun onPostScroll(consumed: Offset, available: Offset, source: NestedScrollSource): Offset {
        scrollOffset = (scrollOffset - consumed.y).coerceAtLeast(0f)
        return Offset.Zero
      }
    }
  }
  val scrolled by remember { derivedStateOf { scrollOffset > 0.5f } }
  val edgeAlpha by animateFloatAsState(targetValue = if (scrolled) 1f else 0f, label = "placeCardHeaderEdge")
  val edgeColor = MaterialTheme.colorScheme.outlineVariant

  Column(modifier = Modifier.fillMaxSize()) {
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .zIndex(1f)
        .drawWithContent {
          drawContent()
          if (edgeAlpha > 0f) {
            val thickness = EdgeThickness.toPx()
            val y = size.height - thickness / 2
            drawLine(
              color = edgeColor,
              start = Offset(0f, y),
              end = Offset(size.width, y),
              strokeWidth = thickness,
              alpha = edgeAlpha
            )
          }
        }
    ) {
      Child(0)
    }
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .weight(1f)
        .nestedScroll(connection),
      // The list fills its slot whatever size it would choose itself.
      propagateMinConstraints = true
    ) {
      Child(1)
    }
  }
}
