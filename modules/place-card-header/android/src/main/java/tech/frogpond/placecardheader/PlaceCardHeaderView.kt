@file:OptIn(ExperimentalComposeUiApi::class)

package tech.frogpond.placecardheader

import android.provider.Settings
import androidx.compose.foundation.MarqueeSpacing
import androidx.compose.foundation.basicMarquee
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import kotlin.math.roundToInt

/**
 * The caller's header buttons: Material's 48dp touch target, and the gap
 * between a button and the title. The buttons are not drawn here; the caller
 * layers its own over this view's top corners.
 */
internal val ButtonSize = 48.dp
private val ButtonGap = 12.dp

/** How far the title slot sits in from each side of this view. */
private val TitleInset = ButtonSize + ButtonGap

/** The moving title is drawn this much further in than the slot on each side. */
private val MarqueeInset = 8.dp

/** The title's top sits this far below the buttons' top when a subtitle follows. */
private val TitleTopOffset = 2.dp

/** First pass after the view appears, and the cycle after that, as in Apple Maps. */
private const val FirstPassMillis = 6_000
private const val CycleMillis = 60_000

/** How fast the title moves, per second. */
private val Speed = 30.dp

/** Space between the end of the name and the copy that follows it round. */
private val Gap = 40.dp
private val LeadingFade = 8.dp
private val TrailingFade = 48.dp

@OptimizedComposeProps
data class PlaceCardHeaderProps(
  val title: String = "",
  val subtitle: String? = null,
  /** True at the stops where a long name may move. A name that fits never moves. */
  val animate: Boolean? = null,
  /** True where the card shows its name some other way: no space, nothing drawn, still mounted. */
  val hidden: Boolean? = null,
  val testID: String? = null
) : ComposeProps

/**
 * A place card's title and subtitle, laid out between the caller's header
 * buttons. A title that fits is centred; one that does not fades out at its
 * trailing edge and, while `animate` is on, scrolls past on Maps' cycle.
 *
 * TalkBack reads one heading: the whole title, then the subtitle, however
 * much of either is on screen.
 */
@Composable
fun FunctionalComposableScope.PlaceCardHeaderContent(props: PlaceCardHeaderProps) {
  val hidden = props.hidden == true
  val subtitle = props.subtitle?.takeIf { it.isNotEmpty() }
  val density = LocalDensity.current
  var titleHeight by remember { mutableIntStateOf(0) }
  // While the title's bottom is above the buttons' bottom edge, the subtitle
  // sits beside the buttons and keeps to the title's slot.
  val subtitleBesideButtons = with(density) { TitleTopOffset.toPx() + titleHeight < ButtonSize.toPx() }
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
    Column(
      horizontalAlignment = Alignment.CenterHorizontally,
      // A title with no subtitle under it centres on the buttons.
      verticalArrangement = if (subtitle == null) Arrangement.Center else Arrangement.Top,
      modifier = Modifier
        .fillMaxWidth()
        .then(
          if (subtitle == null) {
            Modifier.heightIn(min = ButtonSize)
          } else {
            Modifier.padding(top = TitleTopOffset)
          }
        )
    ) {
      MarqueeTitle(
        title = props.title,
        animate = props.animate == true,
        modifier = Modifier
          .padding(horizontal = TitleInset + MarqueeInset)
          .onSizeChanged { titleHeight = it.height }
      )
      if (subtitle != null) {
        Text(
          text = subtitle,
          style = MaterialTheme.typography.bodyMedium,
          fontWeight = FontWeight.Medium,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
          maxLines = 1,
          overflow = TextOverflow.Ellipsis,
          modifier = Modifier.padding(horizontal = if (subtitleBesideButtons) TitleInset else 0.dp)
        )
      }
    }
  }
}

/**
 * One line of the title style that fills the width it is offered. A title
 * that fits is drawn plainly and centred. One that does not fades out at the
 * trailing edge, and while `animate` is on (and the system has animations on),
 * makes a pass on Maps' cycle with a copy following `Gap` behind.
 */
@Composable
private fun MarqueeTitle(title: String, animate: Boolean, modifier: Modifier = Modifier) {
  val style = MaterialTheme.typography.titleLarge.copy(
    fontWeight = FontWeight.SemiBold,
    color = LocalContentColor.current
  )
  val measurer = rememberTextMeasurer()
  val reduceMotion = rememberReduceMotion()
  val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
  val density = LocalDensity.current

  BoxWithConstraints(modifier = modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
    val textWidth = remember(title, style) {
      measurer.measure(text = title, style = style, softWrap = false, maxLines = 1).size.width
    }
    val overflows = constraints.hasBoundedWidth && textWidth > constraints.maxWidth

    if (!overflows) {
      Text(text = title, style = style, maxLines = 1, softWrap = false)
    } else {
      val moving = animate && !reduceMotion
      val marquee = if (moving) {
        // Maps' cycle runs from the start of one pass to the start of the
        // next; the marquee's delay runs from the end of one, so the pass's
        // own length comes off it.
        val passMillis = with(density) { (textWidth + Gap.toPx()) / Speed.toPx() * 1000f }.roundToInt()
        Modifier.basicMarquee(
          iterations = Int.MAX_VALUE,
          initialDelayMillis = FirstPassMillis,
          repeatDelayMillis = (CycleMillis - passMillis).coerceAtLeast(0),
          spacing = MarqueeSpacing(Gap),
          velocity = Speed
        )
      } else {
        Modifier
      }
      Text(
        text = title,
        style = style,
        maxLines = 1,
        softWrap = false,
        modifier = Modifier
          .fillMaxWidth()
          .fadedEdges(leading = if (moving) LeadingFade else 0.dp, trailing = TrailingFade, rtl = rtl)
          .then(marquee)
      )
    }
  }
}

/** Fades the content out over `leading` and `trailing` at its two ends. */
private fun Modifier.fadedEdges(leading: Dp, trailing: Dp, rtl: Boolean): Modifier =
  this
    // Offscreen, so the gradient below masks the text alone rather than
    // punching through to whatever is behind the card.
    .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
    .drawWithContent {
      drawContent()
      val width = size.width.coerceAtLeast(1f)
      val lead = (leading.toPx() / width).coerceIn(0f, 0.5f)
      val trail = (trailing.toPx() / width).coerceIn(0f, 0.5f)
      val left = if (rtl) trail else lead
      val right = if (rtl) lead else trail
      drawRect(
        brush = Brush.horizontalGradient(
          0f to Color.Transparent,
          left to Color.Black,
          (1f - right) to Color.Black,
          1f to Color.Transparent
        ),
        blendMode = BlendMode.DstIn
      )
    }

/** Whether the person has turned animations off in the system's settings. */
@Composable
internal fun rememberReduceMotion(): Boolean {
  val context = LocalContext.current
  return remember(context) {
    Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
  }
}
