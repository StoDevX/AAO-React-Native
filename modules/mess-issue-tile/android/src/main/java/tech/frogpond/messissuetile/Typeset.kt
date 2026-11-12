package tech.frogpond.messissuetile

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.Hyphens
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextIndent
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * A size on the sheet as type: `dp` density-independent pixels, regardless of the system font
 * scale. The sheet is a miniature page laid out to its own proportions, and TalkBack reads the
 * tile's label rather than its type, so its type keeps its size against the page.
 */
internal fun Density.sheetSp(dp: Float): TextUnit = (dp / fontScale).sp

/** The style of a headline: the system serif (Noto Serif), semibold, hyphenated, cut off with "…". */
internal fun Density.headlineStyle(size: Float, color: Color): TextStyle = TextStyle(
  color = color,
  fontFamily = FontFamily.Serif,
  fontWeight = FontWeight.SemiBold,
  fontSize = sheetSp(size),
  lineHeight = sheetSp(size * 1.2f),
  hyphens = Hyphens.Auto,
  lineBreak = LineBreak.Heading
)

/** A headline in the serif, at most `lines` lines, cut off with "…" at its last. */
@Composable
internal fun Headline(text: String, size: Float, lines: Int, color: Color, modifier: Modifier = Modifier) {
  val density = LocalDensity.current
  val style = remember(density, size, color) { density.headlineStyle(size, color) }
  BasicText(
    text = text,
    modifier = modifier,
    style = style,
    overflow = TextOverflow.Ellipsis,
    maxLines = lines
  )
}

/**
 * A story set in columns, hyphenated and justified, flowing from one column to the next, each
 * column starting as far down as the photo or headline above it reaches. Decoration: on a phone
 * too small to read, and TalkBack reads the tile's label instead.
 *
 * The story is laid out once at a column's width, then drawn once per column, shifted up to the
 * column's first line and clipped to the lines that fit, which is what flowing it through columns
 * of the same width comes to.
 */
@Composable
internal fun ColumnText(
  paragraphs: List<String>,
  columns: Int,
  ink: Color,
  rule: Color,
  /** dp: the top tile's type, or the smaller type under a grid tile's fold */
  typeSize: Float,
  modifier: Modifier = Modifier,
  /** How far down, in dp, each column starts, from the left; a column past the end starts at the top */
  tops: List<Float> = emptyList()
) {
  val measurer = rememberTextMeasurer()
  val density = LocalDensity.current
  val text = remember(paragraphs) { paragraphs.joinToString("\n") }
  val style = remember(density, ink, typeSize) {
    TextStyle(
      color = ink.copy(alpha = ink.alpha * 0.8f),
      fontFamily = FontFamily.Serif,
      fontSize = density.sheetSp(typeSize),
      lineHeight = density.sheetSp(typeSize * 1.25f),
      textAlign = TextAlign.Justify,
      textIndent = TextIndent(firstLine = density.sheetSp(typeSize)),
      hyphens = Hyphens.Auto,
      lineBreak = LineBreak.Paragraph
    )
  }

  Canvas(modifier) {
    if (text.isEmpty() || columns <= 0) return@Canvas
    val gutter = (typeSize * 2).dp.toPx()
    val width = (size.width - gutter * (columns - 1)) / columns
    if (width < 1f) return@Canvas

    val layout = measurer.measure(text, style, constraints = Constraints(maxWidth = width.toInt()))
    var line = 0
    for (column in 0 until columns) {
      val top = tops.getOrNull(column)?.dp?.toPx() ?: 0f
      // A column with no room is left out.
      if (size.height <= top) continue
      val x = column * (width + gutter)

      if (column > 0) {
        val ruleX = x - gutter / 2
        drawLine(rule, Offset(ruleX, top), Offset(ruleX, size.height), strokeWidth = 0.5.dp.toPx())
      }

      if (line >= layout.lineCount) continue
      val available = size.height - top
      val startTop = layout.getLineTop(line)
      var end = line
      while (end < layout.lineCount && layout.getLineBottom(end) - startTop <= available) end++
      if (end == line) continue
      val used = layout.getLineBottom(end - 1) - startTop
      clipRect(left = x, top = top, right = x + width, bottom = top + used) {
        drawText(layout, topLeft = Offset(x, top - startTop))
      }
      line = end
    }
  }
}
