# ArcGIS Online Authorized-User and Related-Table Setup — Version 3.9

## 1. Authentication

Use ArcGIS OAuth user authentication for named California State Parks users. Permanent edits to `RxBurns_Poly` and the related tables must be authorized by the signed-in user's privileges; do not use a browser-embedded API key as the editing identity.

```javascript
authentication: {
  mode: "oauth",
  oauthAppId: "YOUR_REGISTERED_APP_ID",
  oauthPortalUrl: "https://www.arcgis.com",
  requireSignIn: true,
  popup: false,
  allowedOrganizationId: "YOUR_STATE_PARKS_ORG_ID"
}
```

Register the final HTTPS application URL and exact OAuth redirect URL(s) in ArcGIS Online. Test with a normal staff account, not only an administrator.

## 2. Authoritative feature service

Version 3.9 expects `RxBurns_Poly` and the seven related tables to be published in the same FeatureServer. The supplied file geodatabase used these exact table names:

- `Preferred_Weather_Prescriptions`
- `Forecast_Runs`
- `Forecast_Periods_and_Scores`
- `Burn_Events`
- `Actual_Weather_and_Fire_Behavior`
- `Notification_Subscriptions`
- `Notification_Delivery_Log`

Configure the parent layer normally:

```javascript
prescribedBurns: {
  serviceUrl: "https://services2.arcgis.com/.../FeatureServer/0",
  webMapLayerTitle: "RxBurns_Poly",
  layerId: 0,
  allowFeatureServiceEdits: true,
  requireOAuthForEdits: true
}
```

The supplied FGDB parent field is `END_DATE`, so Version 3.9 uses that field as the end-date mapping.

## 3. Related-table configuration

```javascript
relatedData: {
  enabled: true,
  serviceRoot: "",
  requireOAuthForEdits: true,
  loadLatestForecastScoresOnStart: true,
  tableNames: {
    weatherPrescriptions: "Preferred_Weather_Prescriptions",
    forecastRuns: "Forecast_Runs",
    forecastPeriods: "Forecast_Periods_and_Scores",
    burnEvents: "Burn_Events",
    actualWeather: "Actual_Weather_and_Fire_Behavior",
    notificationSubscriptions: "Notification_Subscriptions",
    notificationDeliveries: "Notification_Delivery_Log"
  },
  export: {
    filePrefix: "CVD_PrescribedFire_FireEffects_ReportData",
    includeNotificationData: false
  }
}
```

Leave `serviceRoot` blank when the tables are in the same FeatureServer as `RxBurns_Poly`. Version 3.9 derives the service root and discovers numeric table IDs by exact table name, so publishing does not require hard-coded table IDs.

## 4. Required relationships

Verify the published REST service retains these relationship mappings:

1. `RxBurns_Poly.GlobalID` → `Preferred_Weather_Prescriptions.BURNUNIT_GUID`
2. `RxBurns_Poly.GlobalID` → `Forecast_Runs.BURNUNIT_GUID`
3. `Forecast_Runs.GlobalID` → `Forecast_Periods_and_Scores.FORECASTRUN_GUID`
4. `RxBurns_Poly.GlobalID` → `Burn_Events.BURNUNIT_GUID`
5. `Burn_Events.GlobalID` → `Actual_Weather_and_Fire_Behavior.BURNEVENT_GUID`
6. `RxBurns_Poly.GlobalID` → `Notification_Subscriptions.BURNUNIT_GUID`
7. `Notification_Subscriptions.GlobalID` → `Notification_Delivery_Log.SUBSCRIPTION_GUID`

## 5. Editing permissions

The intended planner/editor must be able to:

- Query `RxBurns_Poly` and all related tables.
- Add/update `RxBurns_Poly` where the workflow permits.
- Add/update `Preferred_Weather_Prescriptions`.
- Add `Forecast_Runs` and `Forecast_Periods_and_Scores`.
- Add/update `Burn_Events` and `Actual_Weather_and_Fire_Behavior`.
- Add/update `Notification_Subscriptions`.

`Notification_Delivery_Log` should normally be written by the approved server-side notification process, not by the browser.

## 6. Runtime verification

After sign-in, open the Account dialog. Expected state:

```text
Related data: Connected
```

If it reports Partial or Unavailable, inspect the detail text and browser console. Common causes are a table renamed during publishing, a table not included in the service, inconsistent sharing, or insufficient query privileges.

## 7. REST verification

At the FeatureServer root, confirm `tables` lists all seven exact names. Open each table endpoint and confirm Query and the intended Add/Update capabilities for the same non-admin account that will use the app.

## 8. Report-data download

The Burn List **Download report data** button reads the current source layer and all configured related tables. Notification names/email addresses and individual delivery records are excluded by default. See `FIRE_EFFECTS_REPORT_EXPORT.md`.

## 9. Schema note

The supplied `Actual_Weather_and_Fire_Behavior` table lacks a dedicated probability-of-precipitation field. Version 3.9 places an entered POP value into `OBS_NOTES`. Add `POP_PCT` later if independent querying/reporting is needed.


## Version 3.9 published table-name verification

The supplied staging geodatabase metadata shows the published `CVD_PrescribedFire_StagingMap` FeatureServer using these service table names and IDs:

| ID | Published table name | File-geodatabase dataset |
|---:|---|---|
| 10 | Preferred Weather Prescriptions | Preferred_Weather_Prescriptions |
| 20 | Forecast Runs | Forecast_Runs |
| 21 | Forecast Periods and Scores | Forecast_Periods_and_Scores |
| 30 | Burn Events | Burn_Events |
| 31 | Actual Weather and Fire Behavior | Actual_Weather_and_Fire_Behavior |
| 40 | Notification Subscriptions | Notification_Subscriptions |
| 41 | Notification Delivery Log | Notification_Delivery_Log |

Version 3.9 resolves tables by stable ID first and normalized name second. Do not change these IDs during an overwrite.

Before entering records, open the application Account dialog and confirm **Related data: Connected (7/7)**. If the status is Partial or Unavailable, do not continue data entry; review the status detail and browser console. A save operation now fails visibly instead of falling back to browser-only state.
