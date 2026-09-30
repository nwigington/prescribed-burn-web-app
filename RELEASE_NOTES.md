# Release Notes — Version 3.12

* Fixed null NWS ADI/LVORI values being coerced to 0 and incorrectly included in scoring.
* Added an expanded seven-day forecast dialog with frozen factor/preferred columns.
* See `RELEASE_NOTES_v3_12.md` for details.

# Release Notes — Version 3.10

## Burn-event and actual-weather completion

Version 3.10 completes the burn-event form work started after Version 3.9 and uses the fields already present in the supplied `CVD_PrescribedFire_StagingMap_FL.gdb` schema.

### Burn Events

The burn-event dialog now persists and reloads:

- Burn Boss (`BURN_BOSS`)
- Permit / Authorization (`PERMIT_REF`)
- NWS Spot Forecast ID (`SPOT_FORECAST_ID`)
- NWS Spot Forecast URL (`SPOT_FORECAST_URL`)
- Observed Fire Intensity (`INTENSITY_CLASS`)
- Coverage (%) (`COVERAGE_PCT`)
- Effectiveness (`EFFECTIVENESS`)
- Follow-Up Needs (`FOLLOW_UP`)
- Smoke Conditions and Impacts (`SMOKE_NOTES`)
- Burn Event Notes (`EVENT_NOTES`)

The fire-intensity list is read from the ArcGIS Online coded-value domain when available. The file-geodatabase fallback values are Low, Moderate, High, and Extreme.

### Actual Weather and Fire Behavior

`ACTUAL_WEATHER_FIELDS` is now a definition-based structure rather than a two-value array. The form builder can create number inputs, coded direction lists, and multiline text controls from those definitions.

Newly exposed fields include:

- Flame Length (`FLAME_LENGTH_FT`)
- Rate of Spread (`ROS_FT_MIN`)
- Observed Smoke Direction (`SMOKE_DIR`)
- Smoke Behavior (`SMOKE_BEHAVIOR`)
- Observation Notes (`OBS_NOTES`)

Wind and smoke direction controls use the published coded-value domain when available, including Calm and Variable.

The existing web-app Probability of Precipitation value is retained through `OBS_NOTES` because the supplied `Actual_Weather_and_Fire_Behavior` table does not contain a dedicated `POP_PCT` field. Version 3.10 separates that generated note from user-entered observation notes when records are loaded again.

### NWS Spot Forecast

When a user pastes a URL such as `https://spot.weather.gov/forecasts/2600999`, the numeric Spot Forecast ID is extracted automatically. If only the numeric ID is entered, the forecast URL is constructed when the event is saved.

### Validation

- `app.js` passes `node --check`.
- `config.js` passes `node --check`.
- No duplicate HTML IDs were detected.
- All HTML label targets and `aria-controls` targets resolve.
- All cached DOM references resolve to existing elements.
- Stylesheet brace validation passes.
- `config.js` and `styles.css` are unchanged from Version 3.9.


---

# Release Notes — Version 3.9

## Critical related-table persistence correction

Live testing showed that burn events could appear in the interface but disappear after refresh because Version 3.8 did not discover the published related tables.

### Root cause

The file geodatabase uses dataset names with underscores, such as `Burn_Events`, while the published ArcGIS Online FeatureServer exposes display names with spaces, such as `Burn Events`. Version 3.8 required an exact normalized string match that preserved underscores, so all seven table lookups could fail. The write functions then returned early when related storage was unavailable, allowing the UI to add the temporary in-memory record and announce apparent success.

### Corrections

- Uses the actual published table display names.
- Adds stable table-ID fallbacks: 10, 20, 21, 30, 31, 40, and 41.
- Normalizes punctuation, spaces, underscores, and case during discovery.
- Prefers the configured authoritative staging FeatureServer when locating related tables instead of a potentially unrelated web-map view.
- Removes silent no-op persistence behavior.
- Validates add/update capability before related edits.
- Reads each saved related record back from ArcGIS Online before reporting success.
- Shows a blocking alert when a burn-event or preferred-condition save is not persisted.
- Expands the Account dialog status details with the discovered table names and IDs.

### Expected production status

Before entering related data, the Account dialog should show `Connected (7/7)`.


---

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


# Release Notes — Version 3.7

## Responsive and adaptive layout

* Added user-resizable desktop operations panel with pointer and keyboard control.
* Added height-aware compact-laptop styling and container-query reflow for weather/operations content.
* Reworked Map Tools so header/tabs remain visible while the active tool content scrolls.
* Added tablet stacked layout and phone bottom-sheet Map Tools behavior.
* Added local weather-table scrolling and narrower readable table minimums on laptops.
* Preserved Version 3.6 OAuth, web map, service, NWS, and RxBurns_Poly configuration.

# Release Notes — Version 3.5

## Targeted production-preparation corrections

* Used the user-edited Version 3.4 package as the base; OAuth, web map, feature-layer configuration, branding, and existing workflows were preserved.
* Disabled the ArcGIS default popup globally so it no longer overlaps the Map Tools drawer or map workspace.
* Changed the initial Map Tools state to collapsed (`hidden`, `aria-expanded="false"`) while keeping the drawer available on demand.
* Centered dashboard KPI labels and values horizontally and vertically.
* Added resilient California fire-weather alert retrieval through state path/query endpoints plus a Western Region fallback limited by California UGC/SAME metadata.
* Awaited park-unit impact analysis for displayed alerts and retained finite timeout/error states so impact labels do not spin indefinitely.
* Retained lower-right alert wording without the phrase “California State.”

# Release Notes — Version 3.4

## NWS alert intersection correction

* Replaced the Central Valley District-only analysis source with the public statewide `ParkBoundaries` layer.
* Corrected GeoJSON polygon ring orientation before ArcGIS spatial queries.
* Simplifies and projects alert geometries, groups linked NWS zones into query batches, and retries zone geometry when a direct CAP geometry returns no park units.
* Increased zone coverage, limited network/query concurrency, and added a finite analysis timeout so alert cards cannot remain indefinitely in a checking state.
* Removed “California State” from the lower-right alert-impact wording.

## Clear map selection

* Added **Clear selection** to the Map Tools Identify tab.
* Clears the selected burn unit and returns the Identify panel to its default instructions.
* Removes the selected point-forecast marker and resets the point-forecast panel.
* Closes and clears ArcGIS popup state when supported by the active map view.
* Restores normal burn-unit symbology by redrawing the score overlay without a selected unit.
* Cancels an in-progress NWS request associated with the cleared selection.
* Leaves unfinished burn-unit sketches and hosted features unchanged.
* Disables the button when no selection exists and supports Escape when no dialog is open.

# Release Notes — Version 3.2

## Interface corrections

* Darkened the Map Tools button and retained its position to the right of the ArcGIS control rail.
* Removed the browser-only demonstration-mode notice.
* Aligned the three Burn Map workflow controls horizontally on desktop.
* Aligned and centered the three unit weather resource links horizontally on desktop.
* Applied dark styling to native select menus and option lists.

## `RxBurns\_Poly` integration

* Uses the matching web-map feature layer as the authoritative query and edit source.
* Hides temporary score, smoke, sensitive-area, sketch, and forecast-marker layers from the ArcGIS Layer List.
* Reconciles configured field names against actual field names and aliases.
* Reads coded-value and subtype domains to build unit forms and Burn List filters.
* Checks effective editing and add/update capabilities before `applyEdits()`.
* Requires OAuth for permanent edits when `requireOAuthForEdits` is enabled.

## Burn List correction

* Corrected blank year handling. Empty year fields no longer evaluate to zero and eliminate all records.
* Expanded text search to burn-unit name, park unit, and locality.

## Forecast corrections

* Converts Web Mercator burn polygons and map clicks to WGS 84 before NWS requests.
* Makes both Update Forecast Data controls execute the forecast refresh.
* Populates the seven-day matrix with general NWS forecast values.
* Adds grid-data values for precipitation, transport wind, mixing height, and gust when available.
* Adds explicit NWS timeout and HTTP error handling and clears loading states.
* Makes Go To Map activate and focus the Burn Map panel.

## Production notes

Durable burn events, preferred conditions, forecast history, and notification subscribers still require approved related tables or backend services. See `ARCGIS\_ONLINE\_SETUP.md` and `PRODUCTION\_CHECKLIST.md`.

