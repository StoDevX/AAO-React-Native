package tech.frogpond.hyphenatedtext

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.Hyphens
import androidx.compose.ui.text.style.LineBreak
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class HyphenatedTextProps(
  val text: String = ""
) : ComposeProps

class HyphenatedTextModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HyphenatedText")

    // A paragraph in the body style and the secondary colour that hyphenates,
    // for a Compose tree hosted by @expo/ui's Host, whose Material theme it
    // takes its type and colour from. Compose's Text hyphenates when its style
    // asks, and the paragraph line breaking evens out the lines' lengths as
    // the iOS label's does.
    View<HyphenatedTextProps>("HyphenatedTextView") {
      Content { props ->
        Text(
          text = props.text,
          style = MaterialTheme.typography.bodyLarge.copy(
            hyphens = Hyphens.Auto,
            lineBreak = LineBreak.Paragraph
          ),
          color = MaterialTheme.colorScheme.onSurfaceVariant,
          modifier = Modifier.fillMaxWidth()
        )
      }
    }
  }
}
