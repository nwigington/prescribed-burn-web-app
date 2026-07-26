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

# Release Notes — Version 3.3

## Clear map selection

- Added **Clear selection** to the Map Tools Identify tab.
- Clears the selected burn unit and returns the Identify panel to its default instructions.
- Removes the selected point-forecast marker and resets the point-forecast panel.
- Closes and clears ArcGIS popup state when supported by the active map view.
- Restores normal burn-unit symbology by redrawing the score overlay without a selected unit.
- Cancels an in-progress NWS request associated with the cleared selection.
- Leaves unfinished burn-unit sketches and hosted features unchanged.
- Disables the button when no selection exists and supports Escape when no dialog is open.

# Release Notes — Version 3.2

## Interface corrections

- Darkened the Map Tools button and retained its position to the right of the ArcGIS control rail.
- Removed the browser-only demonstration-mode notice.
- Aligned the three Burn Map workflow controls horizontally on desktop.
- Aligned and centered the three unit weather resource links horizontally on desktop.
- Applied dark styling to native select menus and option lists.

## `RxBurns_Poly` integration

- Uses the matching web-map feature layer as the authoritative query and edit source.
- Hides temporary score, smoke, sensitive-area, sketch, and forecast-marker layers from the ArcGIS Layer List.
- Reconciles configured field names against actual field names and aliases.
- Reads coded-value and subtype domains to build unit forms and Burn List filters.
- Checks effective editing and add/update capabilities before `applyEdits()`.
- Requires OAuth for permanent edits when `requireOAuthForEdits` is enabled.

## Burn List correction

- Corrected blank year handling. Empty year fields no longer evaluate to zero and eliminate all records.
- Expanded text search to burn-unit name, park unit, and locality.

## Forecast corrections

- Converts Web Mercator burn polygons and map clicks to WGS 84 before NWS requests.
- Makes both Update Forecast Data controls execute the forecast refresh.
- Populates the seven-day matrix with general NWS forecast values.
- Adds grid-data values for precipitation, transport wind, mixing height, and gust when available.
- Adds explicit NWS timeout and HTTP error handling and clears loading states.
- Makes Go To Map activate and focus the Burn Map panel.

## Production notes

Durable burn events, preferred conditions, forecast history, and notification subscribers still require approved related tables or backend services. See `ARCGIS_ONLINE_SETUP.md` and `PRODUCTION_CHECKLIST.md`.
