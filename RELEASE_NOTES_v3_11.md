# Release Notes — Version 3.11

## Forecast relative humidity correction

* Corrected the seven-day forecast matrix so relative humidity is no longer read from the NWS 12-hour `/forecast` response. NWS removed RH from that endpoint in API version 1.13.
* Version 3.11 derives **minimum daytime relative humidity** from the NWS hourly forecast periods that overlap each daytime period.
* If hourly RH is unavailable, the application falls back to the raw `forecastGridData.relativeHumidity` time series and selects the minimum value overlapping the daytime period.
* The forecast matrix label now reads **Minimum relative humidity (%)** to make the metric explicit.
* The resulting RH value is used by preferred-condition scoring and is persisted to `Forecast Periods and Scores.RH_PCT`.

## ADI and LVORI

* The raw NWS gridpoint endpoint exposes optional fire-weather layers including `atmosphericDispersionIndex` and `lowVisibilityOccurrenceRiskIndex`.
* Version 3.11 reads the maximum Atmospheric Dispersion Index (ADI) and maximum LVORI value overlapping each daytime period when those layers are supplied by the issuing Weather Forecast Office.
* ADI is persisted to `DI_VALUE`; LVORI is persisted to `LVORI_VALUE`.
* ADI and LVORI are included in preferred-condition scoring only when a finite forecast value is available. Missing values remain `n/a` and are not counted in the score denominator.
* The generic `dispersionIndex` grid layer is intentionally not substituted for ADI because NWS exposes both layers and they are not the same fire-weather metric.

## Interface note

A source note below the seven-day forecast table now explains the RH, ADI, and LVORI behavior so staff know how the values are obtained and why some WFOs may still show `n/a` for ADI or LVORI.
