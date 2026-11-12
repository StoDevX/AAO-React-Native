package tech.frogpond.featurerequests

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
class FeatureRequestsProps : ComposeProps

/**
 * The feature request board is KickstartSignal's, an iOS-only Swift package,
 * so Android has no board to show. The JavaScript reports the feature as
 * unavailable here (`isFeatureRequestsAvailable`), so no screen should open
 * this; the view exists so that importing the module still works, and says
 * so, with a way back, should a screen open it all the same.
 */
class FeatureRequestsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FeatureRequests")

    View<FeatureRequestsProps>("FeatureRequestsView") {
      val onBack by Event<Unit>()

      Content {
        Column(
          modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
          verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
          horizontalAlignment = Alignment.CenterHorizontally
        ) {
          Text(
            text = "Feature requests aren't available on Android.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
          )
          TextButton(onClick = { onBack(Unit) }) {
            Text("Back")
          }
        }
      }
    }
  }
}
