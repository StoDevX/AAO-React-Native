# Builds

Which variant to build, and what it installs.

## Overview

| `APP_VARIANT` | Bundle identifier | Home screen |
| --- | --- | --- |
| `carls` | `com.rives.carls` | CARLS |
| `carls-dev` | `com.rives.carls.dev` | CARLS Dev |

The penguin is the primary icon and no St. Olaf icon is bundled. Both use the
`carls` Sentry project. `com.rives.carls` is the CARLS app's own identifier, so
a release build updates CARLS on the App Store.

```bash
mise run carls:ios [device]
```
