/**
 * California State Parks Prescribed Fire Operations Hub
 * Runtime configuration loaded before the ArcGIS Maps SDK CDN.
 *
 * API keys and browser code are visible to users. Restrict any ArcGIS key by
 * approved referrers and privileges. Use ArcGIS OAuth and an approved backend
 * for secured editing, notifications, and audit logging.
 */
window.APP_CONFIG = {
  appTitle: "Prescribed Fire Operations Hub",
  appSubtitle: "California State Parks · Central Valley District",
  brandLogoUrl:
    "https://csparks.maps.arcgis.com/sharing/rest/content/items/a34a88a2f1954858baafcac0ff4b619e/data",
  brandLogoAlt: "California State Parks emblem",
  supportEmail: "Nathanial.Wigington@parks.ca.gov",

  arcgis: {
    sdkVersion: "5.1",
    portalUrl: "https://www.arcgis.com",
    apiKey: "",
    webMapItemId: "b3d7d802b86a4d2e9f8f50b9e5c353a0",
    basemap: "hybrid",
    center: [-120.62, 37.72],
    zoom: 7
  },

  authentication: {
    // "auto" uses OAuth when oauthAppId is populated; otherwise it uses the
    // API key above. Use "oauth" for an authorized-user production app.
    mode: "oauth",
    oauthAppId: "lSLvkCzwNXRHuhAF",
    oauthPortalUrl: "https://www.arcgis.com",
    requireSignIn: true,
    popup: false,
    // Optional but recommended. Enter the California State Parks ArcGIS
    // Online organization ID to reject users from other organizations.
    allowedOrganizationId: ""
  },

  prescribedBurns: {
    serviceUrl: "https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/RxBurns_Poly/FeatureServer/0",
    webMapLayerTitle: "RxBurns_Poly",
    // Keep the URL pointed at the actual feature layer (/FeatureServer/0).
    // layerId is retained as a fallback when a service-root URL is supplied.
    layerId: 0,
    definitionExpression: "",
    allowFeatureServiceEdits: true,
    requireOAuthForEdits: true,
    useDemoWhenUnconfigured: false,
    fallbackToDemoOnLoadError: false,
    useLocalStorageInDemo: false,
    localStorageKey: "csp-prescribed-fire-hub-v3",
    fields: {
      objectId: "OBJECTID",
      globalId: "GlobalID",
      name: "BURN_UNIT",
      parkUnit: "PARK_UNIT",
      locality: "LOCALITY",
      state: "STATE",
      status: "STATUS",
      priority: "PRIORITY",
      burnWindow: "BURN_WINDOW",
      fuel: "FUEL_TYPE",
      ignitionMethod: "IGNITION_METHOD",
      acres: "ACRES_BURNED",
      startDate: "START_DATE",
      endDate: "COMPLETED_DATE",
      lastBurned: "LAST_BURNED",
      objective: "OBJECTIVE",
      notes: "COMMENTS",
      lastUpdated: "LAST_UPDATED"
    }
  },

  parkBoundaries: {
    serviceUrl: "https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/CVD_Park_Boundaries/FeatureServer/0",
    layerId: 0,
    webMapLayerTitle: "California State Park Boundaries — Central Valley District",
    definitionExpression: "",
    initiallyVisible: true,
    nameField: "UNITNAME"
  },

  alertImpacts: {
    // Public statewide park boundaries used only for NWS alert intersection
    // screening. This analysis layer is queried in the background and is not
    // added to the web map or Layer List.
    parkBoundaryServiceUrl:
      "https://services2.arcgis.com/AhxrK3F6WM8ECvDi/arcgis/rest/services/ParkBoundaries/FeatureServer/0",
    parkBoundaryLayerId: 0,
    parkNameField: "UNITNAME",
    definitionExpression: "",
    maxDisplayedParkNames: 12,
    maxAffectedZonesToFetch: 50,
    zoneFetchConcurrency: 6,
    spatialQueryConcurrency: 3,
    analysisTimeoutMs: 20000
  },

  weather: {
    nwsApiRoot: "https://api.weather.gov",
    alertStateCode: "CA",
    alertRegionCode: "WR",
    forecastHours: 12,
    requestTimeoutMs: 25000,
    maxAlertsToDisplay: 6,
    fireWeatherEvents: [
      "Red Flag Warning",
      "Fire Weather Watch",
      "Extreme Fire Danger",
      "Fire Warning"
    ],
    // Official weather.gov hazard-map colors (updated March 10, 2025).
    hazardColors: {
      "Red Flag Warning": "#FF1493",
      "Fire Weather Watch": "#FFDEAD",
      "Extreme Fire Danger": "#E9967A",
      "Fire Warning": "#A0522D"
    }
  },

  externalLinks: {
    nwsSpotForecastRequest: "https://spot.weather.gov/new-request",
    nwsSpotForecastMonitor: "https://spot.weather.gov/",
    nwsFireWeather: "https://www.weather.gov/wrh/fire",
    watchDuty: "https://app.watchduty.org/",
    burnPro3D: "https://burnpro3d.sdsc.edu/",
    nwsHome: "https://www.weather.gov/"
  },

  notifications: {
    endpoint: ""
  },

  sensitiveAreas: {
    services: [],
    demoCategories: [
      "Structures",
      "Schools",
      "Medical response",
      "Law enforcement",
      "Transportation"
    ]
  }
};
