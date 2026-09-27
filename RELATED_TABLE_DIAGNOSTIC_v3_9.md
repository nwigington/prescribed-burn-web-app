# Related Table Diagnostic — Version 3.9

## Confirmed root cause from the supplied staging geodatabase

The local file-geodatabase dataset names and the ArcGIS Online published service names are not identical. The file geodatabase uses underscores, while the published FeatureServer metadata uses spaces. Version 3.8 attempted to match the file-geodatabase names literally and therefore could fail to discover all seven related tables.

| ID | File-geodatabase name | Published FeatureServer name |
|---:|---|---|
| 10 | Preferred_Weather_Prescriptions | Preferred Weather Prescriptions |
| 20 | Forecast_Runs | Forecast Runs |
| 21 | Forecast_Periods_and_Scores | Forecast Periods and Scores |
| 30 | Burn_Events | Burn Events |
| 31 | Actual_Weather_and_Fire_Behavior | Actual Weather and Fire Behavior |
| 40 | Notification_Subscriptions | Notification Subscriptions |
| 41 | Notification_Delivery_Log | Notification Delivery Log |

The supplied staging-service metadata also records service capabilities including Create, Query, Update, Delete, and Editing.

## Why the event appeared and then disappeared

Version 3.8's `persistBurnEvent()` returned without an error when related storage was not connected. The event was then inserted into the browser's in-memory `unit.events` array, so it appeared immediately. Refreshing reconstructed the unit from ArcGIS Online, where no Burn Events row existed, so the temporary event disappeared.

Version 3.9 removes this silent path. A burn event is not added to the interface unless the related-table write succeeds and the saved row can be read back from ArcGIS Online.

## Expected service endpoints

Using the configured service root:

`https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/CVD_PrescribedFire_StagingMap/FeatureServer`

the expected related table endpoints are:

- `/10` Preferred Weather Prescriptions
- `/20` Forecast Runs
- `/21` Forecast Periods and Scores
- `/30` Burn Events
- `/31` Actual Weather and Fire Behavior
- `/40` Notification Subscriptions
- `/41` Notification Delivery Log

## Expected application status

After OAuth sign-in, open the Account dialog. Before entering production records, verify:

`Related data: Connected (7/7)`

The detail should list all seven table names and IDs.

If the status is Partial or Unavailable, do not continue data entry. Review the status detail and browser console before proceeding.

## Burn-event acceptance test

1. Sign in with a normal authorized State Parks account.
2. Confirm Related data is Connected (7/7).
3. Select an existing RxBurns_Poly burn unit.
4. Add a simple planned burn event.
5. Save it.
6. Open the Burn Events table in ArcGIS Online and verify a new row exists.
7. Confirm `BURNUNIT_GUID` equals the selected parent's `GlobalID`.
8. Refresh the web application.
9. Select the same burn unit.
10. Confirm the event reloads from ArcGIS Online.
