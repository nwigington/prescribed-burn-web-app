# Release Notes — Version 3.12

## ADI / LVORI null-value scoring correction

* Corrected JavaScript null coercion that converted missing NWS grid values to numeric `0`.
* Missing `atmosphericDispersionIndex` and `lowVisibilityOccurrenceRiskIndex` grid values now remain `null`.
* Missing ADI/LVORI values display as `n/a`, are written to new forecast-period records as null, and are excluded from the score denominator.
* Applied the same null-safe handling to hourly/grid statistics and forecast display formatting so unavailable weather values cannot silently become zero.
* Relative-humidity minimum calculations now ignore null hourly/grid RH entries instead of treating them as 0%.

## Expanded forecast view

* Added **Expand Forecast** beside Update Forecast Data and Edit Conditions.
* Opens the full seven-day forecast matrix in a large accessible modal dialog.
* Keeps the factor and Preferred columns frozen while scrolling horizontally through all seven forecast days.
* The expanded matrix mirrors the same values and scores displayed in the inline Weather & Smoke panel.

## Existing records

Forecast Periods and Scores rows created by earlier versions are not rewritten automatically. Run **Update Forecast Data** again after deploying v3.12 to create a new forecast run with corrected null handling.
