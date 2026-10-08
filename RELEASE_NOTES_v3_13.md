# Release Notes — Version 3.13

## Expanded 12-hour point forecast

- Added an **Expand Forecast** control to the **Next 12 Hours** section in Weather & Smoke.
- Added a large, responsive modal that displays the complete 12-hour NWS point-forecast table.
- The expanded table retains all hourly columns: Time, Conditions, Temperature, RH, Wind, and Gust.
- The Time column remains visible while horizontally scrolling.
- The expanded view includes forecast location/coordinates and the forecast load timestamp.
- The expand control is disabled until a valid point forecast has loaded and is reset when the map/forecast selection is cleared.
- The expanded table automatically refreshes if new point-forecast data load while the dialog is open.

## Responsive forecast controls

- Applied the responsive forecast-action layout to the seven-day forecast controls.
- Forecast buttons reflow and reduce padding/font size within narrow operations-panel widths instead of overflowing the application.
- The 12-hour expand button stacks below its heading on narrow containers.

No ArcGIS Online schema, OAuth, related-table, scoring, or forecast-persistence changes were made in this revision.
