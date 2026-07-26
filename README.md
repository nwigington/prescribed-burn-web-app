# California State Parks Prescribed Fire Operations Hub — Version 3.4

This package is a static ArcGIS Maps SDK for JavaScript application built with vanilla HTML, CSS, and JavaScript through the ArcGIS CDN. Version 3.4 builds on the Version 3.3 map-selection workflow, keeps `RxBurns\_Poly` as the authoritative burn-unit source and edit target, and corrects statewide NWS alert-to-park intersection screening.

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

## Production limitations still requiring a data design

The following interfaces are present but should not be treated as durable production records until related hosted tables or approved services are configured:

* burn events and actual-weather observations;
* preferred-condition records and forecast snapshots;
* notification subscribers and email delivery;
* conceptual smoke-sensitive area results.

For production, use related tables keyed by GlobalID/GUID, editor tracking, authenticated edits, and an approved notification or integration service. Do not store subscriber email addresses in unsecured client-side state.

## Files

* `index.html` — application structure and dialogs
* `styles.css` — dark glassmorphism and responsive design
* `app.js` — ArcGIS, schema/domain, editing, weather, filtering, and smoke logic
* `config.js` — portal, item, layer, field, weather, and link configuration
* `ARCGIS\_ONLINE\_SETUP.md` — authorized-user and editable-layer setup
* `PRODUCTION\_CHECKLIST.md` — deployment and acceptance checklist
* `ACCESSIBILITY.md` — accessibility implementation and tests
* `FEATURE\_MATRIX.md` — feature status and production dependencies
* `RELEASE\_NOTES.md` — version-specific corrections

