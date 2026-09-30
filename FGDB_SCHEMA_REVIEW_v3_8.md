# File Geodatabase Schema Review — Version 3.8

Source reviewed: `CVD_PrescribedFire_StagingMap_FL.zip`.

## Dataset inventory

| Dataset | Type | Records | Key fields |
|---|---|---:|---|
| `RxBurns_Poly` | Polygon feature class | 25 | GlobalID |
| `RxBurns_Poly__ATTACH` | Attachment table | 0 | REL_GLOBALID |
| `Preferred_Weather_Prescriptions` | Related table | 0 | BURNUNIT_GUID, GlobalID |
| `Forecast_Runs` | Related table | 0 | BURNUNIT_GUID, PRESCRIPTION_GUID, GlobalID |
| `Forecast_Periods_and_Scores` | Related table | 0 | FORECASTRUN_GUID, BURNUNIT_GUID, PRESCRIPTION_GUID, GlobalID |
| `Burn_Events` | Related table | 0 | BURNUNIT_GUID, GlobalID |
| `Actual_Weather_and_Fire_Behavior` | Related table | 0 | BURNEVENT_GUID, BURNUNIT_GUID, GlobalID |
| `Notification_Subscriptions` | Related table | 0 | BURNUNIT_GUID, GlobalID |
| `Notification_Delivery_Log` | Related table | 0 | SUBSCRIPTION_GUID, BURNUNIT_GUID, FORECASTRUN_GUID, GlobalID |

At review, the geodatabase contained 25 `RxBurns_Poly` features. The seven planning/notification related tables were structurally present but contained no rows.

## Relationship classes

| Relationship | Origin | Destination | Key mapping |
|---|---|---|---|
| `has_weather_prescriptions` | `RxBurns_Poly` | `Preferred_Weather_Prescriptions` | `GlobalID` → `BURNUNIT_GUID` |
| `has_notification_subscriptions` | `RxBurns_Poly` | `Notification_Subscriptions` | `GlobalID` → `BURNUNIT_GUID` |
| `has_forecast_runs` | `RxBurns_Poly` | `Forecast_Runs` | `GlobalID` → `BURNUNIT_GUID` |
| `has_burn_events` | `RxBurns_Poly` | `Burn_Events` | `GlobalID` → `BURNUNIT_GUID` |
| `has_forecast_periods` | `Forecast_Runs` | `Forecast_Periods_and_Scores` | `GlobalID` → `FORECASTRUN_GUID` |
| `has_actual_weather_observations` | `Burn_Events` | `Actual_Weather_and_Fire_Behavior` | `GlobalID` → `BURNEVENT_GUID` |
| `has_delivery_records` | `Notification_Subscriptions` | `Notification_Delivery_Log` | `GlobalID` → `SUBSCRIPTION_GUID` |

All seven planning relationships are simple one-to-many GlobalID/GUID relationships, matching the v3.8 web-app persistence model.

## Related tables used by v3.8

- `Preferred_Weather_Prescriptions`: active preferred conditions and score thresholds.
- `Forecast_Runs`: one record per NWS forecast refresh.
- `Forecast_Periods_and_Scores`: daily forecast values and scores related to each forecast run.
- `Burn_Events`: planned/completed/canceled burn events.
- `Actual_Weather_and_Fire_Behavior`: actual conditions associated with a burn event.
- `Notification_Subscriptions`: per-burn-unit subscriber preferences.
- `Notification_Delivery_Log`: server-side delivery/audit records. The browser app treats this table as read-only.

## Important schema observations

1. `RxBurns_Poly.GlobalID` is the parent key used by `BURNUNIT_GUID` in the four direct child tables.
2. `Forecast_Runs.GlobalID` is the parent key for `Forecast_Periods_and_Scores.FORECASTRUN_GUID`.
3. `Burn_Events.GlobalID` is the parent key for `Actual_Weather_and_Fire_Behavior.BURNEVENT_GUID`.
4. `Notification_Subscriptions.GlobalID` is the parent key for `Notification_Delivery_Log.SUBSCRIPTION_GUID`.
5. `Actual_Weather_and_Fire_Behavior` does **not** contain a probability-of-precipitation field. The UI still captures that value; v3.8 writes an explanatory note to `OBS_NOTES` when a value is entered. Add a dedicated `POP_PCT` Double field in a future schema revision if that variable should be independently queryable/reportable.
6. The attachment table was present but empty in the supplied geodatabase.
7. `RxBurns_Poly` contains both the original editor-tracking fields and a second `_1` set (`CreationDate_1`, `Creator_1`, `EditDate_1`, `Editor_1`). The web app does not edit system tracking fields.

## Report-data export

Version 3.8 adds a browser download that produces a structured JSON package containing each burn unit, its source attributes and geometry, preferred prescriptions, forecast runs and periods/scores, burn events, and actual-weather/fire-behavior records. Notification personally identifiable information is excluded by default; only subscription/delivery counts are included. Set `relatedData.export.includeNotificationData` to `true` only for an authorized administrative export.