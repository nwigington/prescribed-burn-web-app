# California State Parks Prescribed Fire Operations Hub — Version 3.10

This package is a static ArcGIS Maps SDK for JavaScript application built with vanilla HTML, CSS, and JavaScript through the ArcGIS CDN. Version 3.10 builds on the working Version 3.9 related-table persistence and completes the Burn Event and Actual Weather / Fire Behavior form mappings using the supplied `CVD_PrescribedFire_StagingMap_FL.gdb` schema. It preserves the current ArcGIS Online OAuth workflow, web map, `RxBurns_Poly`, related-table discovery, responsive layout, NWS workflows, and report-data export.

## Run locally

Serve the folder through HTTP rather than opening `index.html` with a `file:///` address.

```powershell
cd "C:\\path\\to\\CVD_Prescribed_Fire_GIS_Hub_v3_10"
python -m http.server 8000
```

Open `http://localhost:8000`.


## Version 3.10 burn-event and fire-behavior completion

Version 3.10 completes the form and persistence mappings for Burn Boss, permit/authorization, NWS Spot Forecast ID and URL, fire intensity, burn coverage, effectiveness, follow-up needs, smoke conditions/impacts, flame length, rate of spread, observed smoke direction, smoke behavior, and observation notes. ArcGIS coded-value domains are used for fire intensity and direction fields when the related tables are available.

The NWS Spot Forecast URL and numeric ID are synchronized in the Burn Event form. Probability of Precipitation remains preserved in `OBS_NOTES` because the supplied actual-weather table does not contain a dedicated `POP_PCT` field.

## Version 3.9 related-table correction

Version 3.9 corrects a related-table discovery defect identified during live ArcGIS Online testing. The file geodatabase contains internal table names such as `Burn_Events`, but the published FeatureServer exposes display names such as **Burn Events**. Version 3.8 compared those names literally, so no related tables were discovered and the persistence functions could return without writing a record. The UI could therefore display a newly added event until refresh even though ArcGIS Online contained no row.

Version 3.9 now:

* uses the published FeatureServer display names;
* uses stable table IDs 10, 20, 21, 30, 31, 40, and 41 as a fallback;
* normalizes spaces, underscores, punctuation, and case during table discovery;
* prefers the configured authoritative `CVD_PrescribedFire_StagingMap` FeatureServer over a web-map view when locating related tables;
* refuses to report a related-record save as successful when related storage is disconnected; and
* reads the saved record back from ArcGIS Online before the UI reports success.

After deployment, the Account dialog should report **Related data: Connected (7/7)** before production related records are entered.

## Version 3.9 changes

* Reviewed the supplied file geodatabase containing 25 `RxBurns_Poly` features and seven planning/notification related tables.
* Added runtime discovery of the exact published related tables from the same FeatureServer as `RxBurns_Poly`; numeric table IDs do not need to be hard-coded.
* Preferred weather conditions now load from and save to `Preferred_Weather_Prescriptions`.
* Successful forecast refreshes create `Forecast_Runs` and related `Forecast_Periods_and_Scores` rows; persisted latest scores are restored after reload.
* Burn events now load from and save to `Burn_Events`, with actual weather/fire-behavior observations stored in `Actual_Weather_and_Fire_Behavior`.
* Notification subscribers now load from and save to `Notification_Subscriptions`; removal deactivates the record.
* `Notification_Delivery_Log` is treated as browser read-only and reserved for the future server-side delivery process.
* Added related-data connection diagnostics to the Account dialog.
* Added **Download report data** to the Burn List. It generates a structured JSON file containing burn-unit attributes/geometry and related prescriptions, forecast history/scores, burn events, and actual weather/fire behavior.
* Notification PII is excluded from report exports by default.
* Updated the configured parent end-date field to the supplied schema's `END_DATE`.

## Version 3.7 changes

* Added a fluid desktop map/operations split using `clamp()` and a user-resizable divider.
* Stores the preferred operations-panel width locally and supports keyboard resizing with Left/Right Arrow, Home, and End.
* Added container queries so weather cards, resource buttons, details, and smoke controls reflow based on the actual operations-panel width.
* Added compact-laptop rules for displays at or below 1280 px wide or 850 px high, reducing whitespace rather than shrinking text below readable sizes.
* Reworked Map Tools as a fixed-header/tab drawer with only the tool content scrolling; on phones it becomes a bottom sheet.
* Added local vertical scrolling to dense weather tables on short laptop displays and preserved horizontal table scrolling for readable values.
* Changed tablet layout to stack the operations content beneath the map rather than compressing both columns.
* Improved phone header, navigation, Burn List cards, forms, dialogs, and weather-resource layouts.
* Preserved the Version 3.6 OAuth/Microsoft 365 sign-in hotfix and current production configuration.

## Version 3.6 changes

* Preserves the OAuth authentication hotfix, organization-specific sign-in path, operations-panel initialization correction, and current GitHub Pages redirect workflow from the user-provided source package.

## Version 3.5 changes

* Disables the ArcGIS default popup at both the map-component and MapView levels so selected-feature information is presented only in the Map Tools drawer.
* Starts the application with the Map Tools drawer minimized while retaining the existing Map Tools button.
* Centers both labels and values in all four dashboard statistic cards.
* Strengthens NWS alert retrieval with the documented state path endpoint, query-form fallback, and a Western Region metadata fallback for multi-state California products.
* Waits for each displayed alert's park-unit intersection analysis to finish or time out before marking the alert section fully loaded.
* Preserves the shorter lower-right wording, such as “3 park units affected,” without “California State.”

## Version 3.4 changes

* Corrected NWS alert-to-park intersection screening to use the public statewide `ParkBoundaries` layer instead of the Central Valley District-only map layer.
* Normalizes GeoJSON ring orientation, simplifies alert polygons, projects WGS 84 geometries to Web Mercator when required, and groups zone polygons into reliable spatial-query batches.
* Increased affected-zone coverage, limited request concurrency, and added a 20-second analysis timeout so alert cards cannot remain indefinitely in a checking state.
* Shortened lower-right alert language to “park unit” and removed “California State” from the analysis text.

## Version 3.3 changes

* Added an accessible **Clear selection** control to the Map Tools **Identify** tab.
* Clears the active burn-unit selection, selected point-forecast marker, popup state, and point-forecast results without deleting features or clearing an unfinished sketch.
* Restores the default Identify instructions and normal burn-unit symbology after clearing.
* Disables the control when no map selection is active.
* Supports the Escape key as a keyboard equivalent when no dialog is open.
* Treats a new empty-map point forecast as the active selection and clears prior map-selection context.

## Version 3.2 changes

* Darkened the **Map tools** button for reliable contrast over bright basemaps.
* Removed the browser-only demonstration-mode notice.
* Aligned the three Burn Map workflow controls in one row on desktop.
* Aligned the three unit weather resource links in one row on desktop.
* Corrected burn-unit centroid conversion from Web Mercator to geographic coordinates.
* Corrected map-click point-forecast coordinate handling.
* Added explicit NWS timeout and HTTP error reporting so forecast requests do not remain indefinitely busy.
* Added NWS grid-forecast values for quantitative precipitation, transport wind, mixing height, and gust when available.
* Corrected the empty-year filter defect that could remove every burn unit from the Burn List.
* Made Burn List filters and burn-unit forms read field aliases and coded-value domains from `RxBurns\_Poly` at runtime.
* Made both **Update forecast data** controls run the same forecast-refresh workflow and populate the seven-day matrix.
* Hid temporary application graphics from the standard ArcGIS Layer List.
* Uses the `RxBurns\_Poly` web-map layer, or the configured service layer as a fallback, for query and `applyEdits` operations.
* Added dark native select and option styling for the burn-event form.

## Authoritative burn-layer behavior

The application first searches the configured web map for `RxBurns\_Poly` by exact title, matching service URL, or a recognizable prescribed-burn title. When found, that layer becomes the source for:

* burn-unit queries;
* field aliases;
* coded-value domains and subtype domains;
* edit capability checks; and
* add/update operations.

The application draws a separate forecast-score overlay so burn units can be symbolized by high, medium, low, or unknown burn score. That overlay and other temporary graphics are hidden from the ArcGIS Layer List. The authoritative `RxBurns\_Poly` layer remains represented in the Layer List.

## ArcGIS configuration

Edit `config.js`.

```javascript
arcgis: {
  portalUrl: "https://www.arcgis.com",
  webMapItemId: "YOUR\_WEB\_MAP\_ITEM\_ID"
},

authentication: {
  mode: "oauth",
  oauthAppId: "YOUR\_REGISTERED\_APP\_ID",
  oauthPortalUrl: "https://www.arcgis.com",
  requireSignIn: true,
  popup: false,
  allowedOrganizationId: "YOUR\_STATE\_PARKS\_ORG\_ID"
},

prescribedBurns: {
  serviceUrl: "https://services2.arcgis.com/.../FeatureServer/0",
  webMapLayerTitle: "RxBurns_Poly",
  layerId: 0,
  allowFeatureServiceEdits: true,
  requireOAuthForEdits: true
},

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

The field mapping under `prescribedBurns.fields` is treated as a preferred mapping. After the layer loads, the application reconciles those names against actual REST field names and aliases, then builds the form and filters from the layer's domains.

See `ARCGIS\_ONLINE\_SETUP.md` for the full authorized-user setup and testing sequence.

## Forecast behavior

For a map click or selected burn unit, the application:

1. converts the point or polygon center to WGS 84 longitude and latitude;
2. requests the NWS `/points/{latitude},{longitude}` endpoint;
3. follows the returned hourly, daily, and grid-data URLs;
4. renders the point forecast; and
5. scores the seven daytime forecast periods against the unit's preferred conditions.

NWS does not provide every advanced fire-behavior value through the general point forecast. Dispersion Index and LVORI remain `n/a` unless a future approved source is configured. The official **NWS Spot Forecast** link remains available for operational requests.

## Related-data persistence

Version 3.9 is wired to the supplied GlobalID/GUID relationship design. When the seven tables are published with `RxBurns_Poly` in the same feature service and shared/editable to the OAuth user, the app persists preferred prescriptions, forecast runs/periods and scores, burn events, actual weather/fire behavior, and notification subscriptions. See `FGDB_SCHEMA_REVIEW_v3_8.md` and `ARCGIS_ONLINE_SETUP.md`.

The remaining production dependencies are the approved server-side notification-delivery process and any future authoritative smoke/monitoring datasets. `Notification_Delivery_Log` is intentionally not written by the browser.

## Files

* `index.html` — application structure and dialogs
* `styles.css` — dark glassmorphism and responsive design
* `app.js` — ArcGIS, schema/domain, editing, weather, filtering, and smoke logic
* `config.js` — portal, item, layer, field, weather, and link configuration
* `ARCGIS\_ONLINE\_SETUP.md` — authorized-user and editable-layer setup
* `PRODUCTION\_CHECKLIST.md` — deployment and acceptance checklist
* `ACCESSIBILITY.md` — accessibility implementation and tests
* `FEATURE\_MATRIX.md` — feature status and production dependencies
* `FGDB_SCHEMA_REVIEW_v3_8.md` — reviewed file-geodatabase tables, relationships, counts, and schema observations
* `FIRE_EFFECTS_REPORT_EXPORT.md` — report-data download structure and handling guidance
* `RELEASE_NOTES_v3_8.md` — Version 3.9 persistence/export changes
* `RELEASE_NOTES.md` — current and prior release notes
## Version 3.12 forecast correction

Version 3.12 preserves missing ADI/LVORI grid values as `n/a` and excludes them from scoring rather than coercing null values to zero. The Weather & Smoke panel also includes an **Expand Forecast** dialog for full-width review of the seven-day matrix.

