# Version 3.7 responsive-layout update

## Responsive application shell

- Uses viewport-aware and container-aware layout rules instead of fixed desktop assumptions.
- Preserves readable text and 44-pixel controls; the application reflows rather than globally scaling down.
- Adds compact-density rules for laptops with limited vertical space.

## Map Tools

- Drawer header and Identify/Draw/Legend tabs remain fixed while the active tool body scrolls independently.
- Drawer width is fluid on desktop and becomes a bottom sheet on phone-sized screens.
- Short-height layouts reduce padding and spacing while preserving control size and legibility.

## Operations / weather panel

- Desktop operations width is fluid and can be resized by dragging the divider.
- The divider is keyboard accessible: Left Arrow widens, Right Arrow narrows, Home sets minimum width, and End sets maximum width.
- Width preference is saved in local storage.
- Weather cards, detail grids, smoke controls, resource links, and section headings respond to the panel's own width through CSS container queries.
- Dense weather tables receive local scrolling on compact-height laptops so the entire side panel requires less scrolling.

## Tablet and phone behavior

- At 960 px and below, the map is placed above the operations content.
- At 700 px and below, Map Tools becomes a bottom sheet and navigation becomes a horizontally scrollable tab row.
- Burn tables continue to switch to card records on narrow screens.

## Preserved application behavior

- No ArcGIS item IDs, service URLs, OAuth client ID, RxBurns_Poly field mappings, NWS endpoints, or editing workflows were intentionally changed.
- Version 3.6 OAuth authentication corrections remain intact.
