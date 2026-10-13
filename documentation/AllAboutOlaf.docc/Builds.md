# Builds

Which variant to build, and what it installs.

## Overview

`APP_VARIANT` names the app a build is. It has no default, so a forgotten
variant fails at once.

| `APP_VARIANT` | Bundle identifier | Home screen |
| --- | --- | --- |
| `aao` | `NFMTHAZVS9.com.drewvolz.stolaf` | All About Olaf |
| `aao-dev` | `…stolaf.dev` | AAO Dev |

Both use the windmill icon and the `all-about-olaf` Sentry project, so tell
them apart by name. TestFlight and App Store builds ship `aao`.

```bash
mise run aao:ios [device]
```
