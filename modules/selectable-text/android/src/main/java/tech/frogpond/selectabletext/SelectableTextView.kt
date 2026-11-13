package tech.frogpond.selectabletext

import android.text.SpannableString
import android.text.style.URLSpan
import android.text.util.Linkify
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withLink
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.ColorCompat
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import kotlin.math.max

/** The gap between a list item's marker and its text, as on iOS. */
private val MarkerGap = 8.dp

/** Both cases in small capitals, as SwiftUI's `smallCaps()` sets them. */
private const val SmallCapsFeatures = "smcp, c2sc"

/** A stretch of a paragraph sharing one style. */
@OptimizedRecord
data class SelectableTextRun(
  @Field val text: String = "",
  @Field val bold: Boolean? = null,
  @Field val italic: Boolean? = null,
  @Field val smallCaps: Boolean? = null,
  @Field val href: String? = null
) : Record

/** One paragraph of styled text. */
@OptimizedRecord
data class SelectableTextParagraph(
  @Field val runs: List<SelectableTextRun> = emptyList(),
  @Field val italic: Boolean? = null,
  @Field val indent: Double? = null,
  @Field val marker: String? = null,
  @Field val spacingAfter: Double? = null
) : Record

/** The type styles the text can be set in. */
enum class SelectableTextStyle(val value: String) : Enumerable {
  BODY("body"),
  FOOTNOTE("footnote")
}

@OptimizedComposeProps
data class SelectableTextProps(
  val text: String? = null,
  val paragraphs: List<SelectableTextParagraph>? = null,
  val textStyle: SelectableTextStyle? = null,
  val serif: Boolean? = null,
  val italic: Boolean? = null,
  val color: android.graphics.Color? = null,
  val linkColor: android.graphics.Color? = null,
  val lineSpacing: Double? = null,
  val paragraphSpacing: Double? = null,
  val testID: String? = null
) : ComposeProps

/**
 * A block of text the reader can select. Plain text has its phone numbers,
 * email addresses and web links turned into links. Styled paragraphs carry
 * their own links, and sit in one selection container so a selection can run
 * from one paragraph into the next.
 *
 * A tapped web link opens in a Custom Tab; any other link goes to the app
 * that handles its scheme.
 */
@Composable
fun FunctionalComposableScope.SelectableTextContent(props: SelectableTextProps) {
  val context = LocalContext.current
  val scope = this
  val open = remember(context) {
    { url: String -> openLink(scope.appContext.currentActivity ?: context, url) }
  }

  val typography = MaterialTheme.typography
  val type = when (props.textStyle) {
    SelectableTextStyle.FOOTNOTE -> typography.bodySmall
    else -> typography.bodyLarge
  }
  val textColor = props.color?.toComposeColor() ?: LocalContentColor.current
  val linkColor = props.linkColor?.toComposeColor() ?: MaterialTheme.colorScheme.primary
  val baseStyle = type.copy(
    color = textColor,
    fontFamily = if (props.serif == true) FontFamily.Serif else type.fontFamily,
    fontStyle = if (props.italic == true) FontStyle.Italic else type.fontStyle,
    lineHeight = lineHeightWithSpacing(type, props.lineSpacing)
  )
  val linkStyles = remember(linkColor) {
    TextLinkStyles(
      style = SpanStyle(color = linkColor),
      pressedStyle = SpanStyle(color = linkColor, textDecoration = TextDecoration.Underline)
    )
  }

  val paragraphs = props.paragraphs.orEmpty()
  val modifier = Modifier
    .fillMaxWidth()
    .applyTestTag(props.testID)

  SelectionContainer(modifier = modifier) {
    if (paragraphs.isEmpty()) {
      val text = props.text.orEmpty()
      val linked = remember(text, linkStyles, open) { linkified(text, linkStyles, open) }
      Text(text = linked, style = baseStyle, modifier = Modifier.fillMaxWidth())
    } else {
      val italicAll = props.italic == true
      val texts = remember(paragraphs, italicAll, linkStyles, open) {
        paragraphs.map { paragraphText(it, italicAll, linkStyles, open) }
      }
      val defaultSpacing = props.paragraphSpacing ?: 0.0
      Column(modifier = Modifier.fillMaxWidth()) {
        paragraphs.forEachIndexed { index, paragraph ->
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(start = (paragraph.indent ?: 0.0).coerceAtLeast(0.0).dp)
          ) {
            // The marker hangs before the first line; wrapped lines line up
            // with the text, not the marker, as a list's do.
            val marker = paragraph.marker
            if (marker != null) {
              Text(text = marker, style = baseStyle)
              Spacer(modifier = Modifier.width(MarkerGap))
            }
            Text(text = texts[index], style = baseStyle, modifier = Modifier.weight(1f))
          }
          if (index < paragraphs.lastIndex) {
            val spacing = (paragraph.spacingAfter ?: defaultSpacing).coerceAtLeast(0.0)
            Spacer(modifier = Modifier.height(spacing.dp))
          }
        }
      }
    }
  }
}

/**
 * The gap between lines as the iOS view sets it: the type's own leading, or
 * `lineSpacing` (in dp) in its place when that is larger.
 */
@Composable
private fun lineHeightWithSpacing(type: TextStyle, lineSpacing: Double?): TextUnit {
  val spacing = lineSpacing ?: return type.lineHeight
  if (spacing <= 0.0 || !type.lineHeight.isSp || !type.fontSize.isSp) {
    return type.lineHeight
  }
  val spacingSp = with(LocalDensity.current) { spacing.toFloat().dp.toSp() }
  val leading = type.lineHeight.value - type.fontSize.value
  return (type.fontSize.value + max(leading, spacingSp.value)).sp
}

/** One paragraph's runs, each in its own style, a run with an `href` a link. */
private fun paragraphText(
  paragraph: SelectableTextParagraph,
  italicAll: Boolean,
  linkStyles: TextLinkStyles,
  open: (String) -> Unit
): AnnotatedString = buildAnnotatedString {
  val paragraphItalic = italicAll || paragraph.italic == true
  for (run in paragraph.runs) {
    val style = SpanStyle(
      fontWeight = if (run.bold == true) FontWeight.Bold else null,
      fontStyle = if (paragraphItalic || run.italic == true) FontStyle.Italic else null,
      fontFeatureSettings = if (run.smallCaps == true) SmallCapsFeatures else null
    )
    val href = run.href
    if (href.isNullOrEmpty()) {
      withStyle(style) { append(run.text) }
    } else {
      val link = LinkAnnotation.Url(url = href, styles = linkStyles) { open(href) }
      withLink(link) {
        withStyle(style) { append(run.text) }
      }
    }
  }
}

/**
 * Plain text with its web links, email addresses and phone numbers made into
 * links, found by the platform's own `Linkify`, as iOS's data detectors find
 * them in the same text.
 */
private fun linkified(
  text: String,
  linkStyles: TextLinkStyles,
  open: (String) -> Unit
): AnnotatedString {
  val spannable = SpannableString(text)
  Linkify.addLinks(spannable, Linkify.WEB_URLS or Linkify.EMAIL_ADDRESSES or Linkify.PHONE_NUMBERS)
  val spans = spannable.getSpans(0, spannable.length, URLSpan::class.java)
    .sortedBy { spannable.getSpanStart(it) }
  if (spans.isEmpty()) {
    return AnnotatedString(text)
  }
  return buildAnnotatedString {
    var cursor = 0
    for (span in spans) {
      val start = spannable.getSpanStart(span)
      val end = spannable.getSpanEnd(span)
      if (start < cursor || end <= start) {
        continue
      }
      append(text.substring(cursor, start))
      val url = span.url
      withLink(LinkAnnotation.Url(url = url, styles = linkStyles) { open(url) }) {
        append(text.substring(start, end))
      }
      cursor = end
    }
    append(text.substring(cursor))
  }
}

private fun android.graphics.Color.toComposeColor(): androidx.compose.ui.graphics.Color =
  androidx.compose.ui.graphics.Color(ColorCompat.toArgb(this))

/** Exposes `testID` to UI Automator as a resource id, as @expo/ui does. */
@OptIn(ExperimentalComposeUiApi::class)
private fun Modifier.applyTestTag(testID: String?): Modifier =
  if (testID.isNullOrEmpty()) {
    this
  } else {
    this
      .semantics { testTagsAsResourceId = true }
      .testTag(testID)
  }
