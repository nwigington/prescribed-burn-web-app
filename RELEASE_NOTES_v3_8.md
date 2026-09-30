# Release Notes — Version 3.8

## Related-table persistence

Version 3.8 was built against the supplied `CVD_PrescribedFire_StagingMap_FL.gdb` schema. The application now discovers the published related tables from the same FeatureServer as `RxBurns_Poly` and uses OAuth-authenticated `FeatureLayer.applyEdits()` calls for durable storage.

Implemented tables:

- `Preferred_Weather_Prescriptions`
- `Forecast_Runs`
- `Forecast_Periods_and_Scores`
- `Burn_Events`
- `Actual_Weather_and_Fire_Behavior`
- `Notification_Subscriptions`
- `Notification_Delivery_Log` (read-only from the browser)

### Workflow changes

- Preferred weather prescriptions load from and save to `Preferred_Weather_Prescriptions`.
- A successful forecast refresh creates one `Forecast_Runs` record and up to seven related `Forecast_Periods_and_Scores` records.
- Latest persisted forecast scores are loaded on application startup so Dashboard/Burn List scores survive browser reloads.
- Burn events save to `Burn_Events`; entered actual weather/fire-behavior values save to `Actual_Weather_and_Fire_Behavior`.
- Notification subscribers save to `Notification_Subscriptions`; removal deactivates the subscription instead of deleting the audit record.
- Notification delivery history remains server-side/read-only in the browser application.
- The Account dialog reports related-data connection status and missing-table diagnostics.

## Fire-effects report-data export

The Burn List includes **Download report data**. It generates a date-stamped JSON file containing each burn unit and the related planning/monitoring data needed as a future fire-effects-report input:

- authoritative `RxBurns_Poly` attributes;
- polygon geometry;
- preferred weather prescriptions;
- forecast runs;
- forecast periods and scores;
- burn events; and
- actual weather/fire-behavior observations.

Notification email addresses and delivery detail are excluded by default because they contain personal/administrative information and are not normally needed for fire-effects reporting. Set `relatedData.export.includeNotificationData` to `true` only for an authorized administrative export.

## Schema-specific correction

The supplied `Actual_Weather_and_Fire_Behavior` table does not contain `POP_PCT`. When probability of precipitation is entered in the current UI, Version 3.8 preserves that value in `OBS_NOTES`. Add a dedicated `POP_PCT` Double field in a future schema revision if that value needs independent reporting/querying.

## Existing behavior retained

Version 3.8 retains the Version 3.7 responsive layout, resizable operations panel, OAuth/Microsoft 365 sign-in, `RxBurns_Poly` editing workflow, NWS alert and forecast workflows, Map Tools behavior, accessibility features, and California State Parks styling.
