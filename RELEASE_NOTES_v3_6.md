# Version 3.6 authentication hotfix

## Corrected

- Repaired a JavaScript syntax error introduced while adding the collapsible operations panel. The error prevented all application JavaScript from parsing, so OAuth, branding, the web map, feature layers, NWS alerts, and dashboard calculations never initialized.
- Moved operations-panel DOM references and event binding into the normal application initialization sequence.
- Removed a duplicated `operations-panel` element and an extra closing `section` tag from `index.html`.
- Configured OAuth to use the California State Parks organization URL so users are routed to the organization-specific Microsoft 365 sign-in experience.
- Enabled URL-hash preservation for redirect-based OAuth and retained the SDK's automatic PKCE-capable OAuth flow.

## Deployment check

The OAuth app item must include this exact redirect URL:

`https://nwigington.github.io/prescribed-burn-web-app/`

Also verify that the OAuth app is authorized to use the organization login categories configured by California State Parks.
