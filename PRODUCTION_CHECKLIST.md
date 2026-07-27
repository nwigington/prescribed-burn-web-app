# Production Acceptance Checklist

## Hosting and authentication

- [ ] Application is hosted on an agency-approved HTTPS origin.
- [ ] ArcGIS Online Web Mapping Application item points to the final URL.
- [ ] OAuth application is registered with exact redirect URIs.
- [ ] `authentication.oauthAppId` is populated.
- [ ] `authentication.allowedOrganizationId` is populated.
- [ ] Test staff can sign in; non-authorized accounts are rejected.

## ArcGIS content

- [ ] `arcgis.webMapItemId` references the production web map.
- [ ] Web map contains the intended `RxBurns_Poly` layer/view.
- [ ] `prescribedBurns.serviceUrl` ends in the correct `/FeatureServer/<id>`.
- [ ] Web map and all secured dependencies are shared consistently.
- [ ] Definition expressions do not unintentionally exclude records.
- [ ] Normal staff accounts can query records.

## Editing

- [ ] `allowFeatureServiceEdits` and `requireOAuthForEdits` are true.
- [ ] Add and update capabilities are enabled as required.
- [ ] Editor tracking and ownership controls are approved.
- [ ] Add, attribute update, geometry update, activation, and inactivation are tested with a non-admin account.
- [ ] Field aliases and coded domains displayed by the app match `RxBurns_Poly`.

## Weather

- [ ] Map clicks return valid WGS 84 coordinates.
- [ ] NWS hourly and seven-day forecasts load for multiple California locations.
- [ ] Unit forecast refresh populates the matrix and scores.
- [ ] NWS timeout/error messages clear loading indicators.
- [ ] NWS Spot Forecast link opens the official request page.

## Interface and accessibility

- [ ] Map Tools does not obscure zoom/home/locate controls.
- [ ] Map Tools button remains readable over all basemaps.
- [ ] Burn List filters return expected units.
- [ ] Native select menus are readable in supported browsers.
- [ ] Keyboard, screen-reader, 200%/400% zoom, reflow, contrast, and reduced-motion tests are complete.

## Data architecture before operational use

- [ ] Related table for preferred conditions is configured.
- [ ] Related table for forecast snapshots is configured if retention is required.
- [ ] Related table for burn events/actual weather is configured.
- [ ] Notification subscriber storage and email delivery use an approved secured service.
- [ ] Smoke-screening disclaimer and operational limitations are approved.
