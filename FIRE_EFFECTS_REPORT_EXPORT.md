# Fire Effects Report Data Export

Version 3.8 adds **Download report data** to the Burn List. The download is a structured UTF-8 JSON file intended to preserve the one-to-many relationships needed for later analysis or transformation into a fire-effects monitoring report.

## Default filename

`CVD_PrescribedFire_FireEffects_ReportData_YYYY-MM-DD.json`

The prefix is configurable under `relatedData.export.filePrefix` in `config.js`.

## Structure

```text
burnUnits[]
  burnUnit
    RxBurns_Poly attributes
    center latitude/longitude
    polygon geometry
  preferredWeatherPrescriptions[]
  forecastRuns[]
    periods[]
  burnEvents[]
    actualWeatherAndFireBehavior[]
  notificationSummary
```

The application queries the current authoritative feature layer and related tables at download time; the file is not built only from browser cache.

## Notification information

By default:

```javascript
relatedData: {
  export: {
    includeNotificationData: false
  }
}
```

This excludes subscriber names/email addresses and individual delivery-log records while retaining only counts. This is the recommended setting for fire-effects reporting.

For an authorized administrative export only, set `includeNotificationData: true`. The resulting file should then be handled as restricted information.

## Geometry

Each burn unit includes its ArcGIS polygon geometry as JSON, allowing the report dataset to be reprocessed in GIS or scripting workflows. The export is not a replacement for the authoritative hosted feature layer.

## Suggested future report workflow

1. Download the JSON report dataset after the burn/monitoring period.
2. Retain the file with the project record according to agency records requirements.
3. Use Python, ArcGIS Pro, Excel/Power Query, or another approved reporting workflow to flatten selected sections into tables.
4. Join monitoring/effects measurements to the burn-unit `GlobalID` and/or burn-event `GlobalID` when later fire-effects tables are added.
5. Use the authoritative hosted service for any corrections; regenerate the report dataset afterward.
