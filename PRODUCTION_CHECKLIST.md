# Production Acceptance Checklist — Version 3.8

## Hosting and authentication

- [ ] Application is hosted on an agency-approved HTTPS origin.
- [ ] ArcGIS Online Web Mapping Application item points to the final URL.
- [ ] OAuth application is registered with exact redirect URIs.
- [ ] `authentication.oauthAppId` and `authentication.allowedOrganizationId` are populated.
- [ ] Normal State Parks staff can sign in; unauthorized accounts are rejected.

## ArcGIS feature service

- [ ] Production web map contains the intended `RxBurns_Poly` layer/view.
- [ ] `prescribedBurns.serviceUrl` points to the correct `/FeatureServer/<layerId>`.
- [ ] The same FeatureServer exposes all seven v3.8 related tables.
- [ ] `RxBurns_Poly` and each related table are shared to the intended users/groups.
- [ ] Query is enabled for the parent and related tables.
- [ ] Add/Update are enabled where the application writes records.
- [ ] `Notification_Delivery_Log` is not editable by ordinary browser users unless specifically approved.
- [ ] Editor tracking and ownership controls are configured as required.

## Relationship verification

- [ ] `RxBurns_Poly.GlobalID` → `Preferred_Weather_Prescriptions.BURNUNIT_GUID`.
- [ ] `RxBurns_Poly.GlobalID` → `Forecast_Runs.BURNUNIT_GUID`.
- [ ] `Forecast_Runs.GlobalID` → `Forecast_Periods_and_Scores.FORECASTRUN_GUID`.
- [ ] `RxBurns_Poly.GlobalID` → `Burn_Events.BURNUNIT_GUID`.
- [ ] `Burn_Events.GlobalID` → `Actual_Weather_and_Fire_Behavior.BURNEVENT_GUID`.
- [ ] `RxBurns_Poly.GlobalID` → `Notification_Subscriptions.BURNUNIT_GUID`.
- [ ] `Notification_Subscriptions.GlobalID` → `Notification_Delivery_Log.SUBSCRIPTION_GUID`.

## Related-data workflow tests

- [ ] Account dialog reports **Related data: Connected**.
- [ ] Saving preferred conditions creates/updates the correct related prescription.
- [ ] Reloading the browser restores preferred conditions from the hosted table.
- [ ] Updating a burn-unit forecast creates one `Forecast_Runs` row.
- [ ] Forecast update creates the expected related daily period/score rows.
- [ ] Reloading the browser restores the latest persisted burn scores.
- [ ] Adding a burn event creates a `Burn_Events` row linked to the correct burn unit.
- [ ] Entered actual weather creates/updates `Actual_Weather_and_Fire_Behavior`.
- [ ] Subscriber creation writes `Notification_Subscriptions` with the correct `BURNUNIT_GUID`.
- [ ] Removing a subscriber deactivates the record rather than silently deleting audit history.
- [ ] A user without table-edit privileges receives a visible error and no false success message.

## Report-data export

- [ ] **Download report data** generates a date-stamped JSON file.
- [ ] Export includes all expected burn units.
- [ ] Burn-unit attributes and polygon geometry are present.
- [ ] Prescription, forecast run/period, burn-event, and actual-weather arrays match ArcGIS Online.
- [ ] Notification PII is absent when `includeNotificationData` is false.
- [ ] If administrative notification export is enabled, the downloaded file is handled as restricted information.

## Weather

- [ ] Map clicks return valid WGS 84 coordinates.
- [ ] NWS hourly and seven-day forecasts load at representative park locations.
- [ ] Unit forecast refresh populates the matrix and persists results.
- [ ] NWS timeout/error messages clear loading indicators.
- [ ] NWS Spot Forecast link opens the official request page.

## Interface and accessibility

- [ ] Map Tools remains usable on desktop and short-height laptop displays.
- [ ] Operations panel resizing works with pointer and keyboard.
- [ ] Burn List filters return expected units.
- [ ] Native select menus are readable in supported browsers.
- [ ] Keyboard, screen-reader, 200%/400% zoom, reflow, contrast, and reduced-motion tests are complete.

## Schema follow-up

- [ ] Decide whether `Actual_Weather_and_Fire_Behavior` should gain a dedicated `POP_PCT` field; v3.8 currently preserves UI-entered POP in `OBS_NOTES`.
- [ ] Smoke-screening model/data limitations and disclaimers are approved before operational reliance.
- [ ] Server-side email notification service and delivery-log writer are approved before notification delivery is enabled.
