# Accessibility Implementation and Validation Plan

The application is designed toward WCAG 2.1 Level AA, the technical standard used by the U.S. Department of Justice rule for state and local government web content. This prototype is not an accessibility certification. Final compliance depends on the authoritative data, ArcGIS configuration, third-party links, hosting environment, and formal user testing.

## Implemented patterns

### Structure and navigation

- Semantic header, navigation, main, map section, complementary operations panel, and footer landmarks
- Skip links to main content and the operations panel
- Logical heading hierarchy
- ARIA tab patterns for application pages and map-tool tabs
- Native HTML dialogs for unit, weather-condition, event, confirmation, account, and help workflows
- Keyboard-accessible tables, disclosures, forms, map controls, and Dashboard section expand/collapse buttons

### Keyboard and focus

- Persistent high-contrast `:focus-visible` indicators
- Minimum 44-pixel control height for principal controls
- Arrow-key navigation among tabs
- No drag-only workflow: geometry editing is map-based, but create/edit actions, records, details, and results remain keyboard accessible
- Burn List and structured data tables provide non-map access to mapped information

### Visual presentation

- Dark theme with opaque-enough glass surfaces over imagery
- Text labels accompany all status colors, including the NWS event name and burn-score category
- Forecast chips include accessible names containing date and score
- Responsive reflow to a single-column mobile layout
- Reduced-motion support
- Windows Forced Colors support
- No information conveyed only by hover
- Collapsible Dashboard regions expose `aria-expanded`, `aria-controls`, visible plus/minus states, and screen-reader action text

### Forms and status messages

- Explicit labels and fieldsets
- Required-field validation through native HTML controls
- Live-region announcements for selections, drawing completion, saving, filtering, forecast loading, and errors
- Confirmation step for activation/inactivation and geometry replacement
- Error messages avoid relying on color alone

### Tables

- Header cells use `scope`
- Scrollable table containers are keyboard focusable and labeled
- Mobile Burn List cards present the same core information as the desktop table

## Required pre-release testing

Test the final configured application with:

1. Keyboard only, including drawing alternatives and every dialog.
2. NVDA with Chrome and Firefox on Windows.
3. JAWS with Chrome or Edge if used by the agency.
4. VoiceOver with Safari on macOS and iOS.
5. Android TalkBack if mobile field use is expected.
6. 200 and 400 percent browser zoom.
7. 320 CSS-pixel viewport reflow.
8. Windows High Contrast / Forced Colors.
9. Reduced-motion preference.
10. Automated testing with axe-core, Accessibility Insights, and a valid HTML checker.
11. Contrast testing after inserting final logos, imagery, and operational layer symbols.
12. Usability testing with non-GIS staff and prescribed-fire practitioners.

## Known prototype limitations

- The ArcGIS map is inherently visual; the Burn List is the primary non-map alternative.
- Geometry sketching remains easier with a pointing device. A production workflow should support uploaded boundaries, Survey123/Field Maps alternatives, or another accessible non-drag geometry workflow.
- The conceptual smoke plume is not an authoritative model and must be described consistently in visible text and documentation.
- External sites, including NWS Spot Forecast, have their own accessibility conformance and are outside this application's control.
- Email notifications and authentication are interface placeholders until approved services are connected.

## Clear selection control

The Map Tools Identify tab includes a keyboard-operable **Clear selection** button with a 44-pixel minimum target. It is disabled when no map selection is active, announces completion through the application live region, and has an Escape-key equivalent when no modal dialog is open. Clearing a selection does not delete a hosted feature or discard an unfinished sketch.
