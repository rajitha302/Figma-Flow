# Figma Plugin API Reference
**Complete Developer Documentation for FigmaFlow Plugin**

> **Last Updated**: January 2025
> **Source**: Official Figma Plugin API via Context7
> **Purpose**: Comprehensive reference for developing the FigmaFlow plugin

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Plugin Manifest](#plugin-manifest)
3. [Core APIs](#core-apis)
4. [Vector & Path Creation](#vector--path-creation)
5. [Selection Handling](#selection-handling)
6. [Event System](#event-system)
7. [UI Communication](#ui-communication)
8. [Stroke & Fill Styling](#stroke--fill-styling)
9. [Data Storage](#data-storage)
10. [Best Practices](#best-practices)

---

## Getting Started

### Environment Setup
```bash
# Install TypeScript typings (HIGHLY RECOMMENDED)
npm install --save-dev @figma/plugin-typings

# TypeScript is strongly recommended for plugin development
npm install --save-dev typescript
```

### Basic Plugin Structure
```
figmaflow/
├── manifest.json       # Plugin configuration
├── code.ts            # Main plugin code (sandbox environment)
├── ui.html            # UI interface (iframe environment)
├── tsconfig.json      # TypeScript configuration
└── package.json       # Node dependencies
```

---

## Plugin Manifest

### Required Fields (2025)
```json
{
  "name": "FigmaFlow",
  "id": "figmaflow-plugin",
  "api": "1.0.0",
  "main": "dist/code.js",
  "documentAccess": "dynamic-page"  // REQUIRED field
}
```

### Complete Manifest Example
```json
{
  "name": "FigmaFlow",
  "id": "figmaflow-plugin",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "documentAccess": "dynamic-page",
  "editorType": ["figma", "figjam"],
  "networkAccess": {
    "allowedDomains": ["none"]
  },
  "menu": [
    {
      "name": "Create Flow Arrow",
      "command": "create-flow"
    },
    {
      "name": "Settings",
      "command": "settings"
    }
  ],
  "relaunchButtons": [
    {
      "command": "edit-flow",
      "name": "Edit Flow Arrows"
    }
  ]
}
```

### Key Manifest Properties
- **`documentAccess`**: REQUIRED - Must be set to `"dynamic-page"`
- **`editorType`**: Where plugin works (`["figma", "figjam"]`)
- **`networkAccess`**: Controls external network resources (security)
- **`menu`**: Custom plugin menu items
- **`relaunchButtons`**: Buttons that appear in properties panel

---

## Core APIs

### Global Figma Object
The global `figma` object is available in the plugin sandbox and provides all API access.

```typescript
// Key properties
figma.currentPage          // Current page node
figma.root                 // Document root
figma.editorType          // "figma" | "figjam" | "dev"
figma.mode                // Current editor mode
figma.viewport            // Current viewport information
```

### Common Methods
```typescript
// Node creation
figma.createVector()
figma.createRectangle()
figma.createText()
figma.createFrame()

// Selection
figma.currentPage.selection  // Current selection array

// Plugin control
figma.closePlugin()
figma.closePlugin('Success message')

// UI
figma.showUI(__html__, options)
figma.ui.postMessage(message)
```

---

## Vector & Path Creation

### Creating Vector Nodes
```typescript
// Create an empty vector
const vector = figma.createVector();

// Vector will be parented to current page by default
figma.currentPage.appendChild(vector);
```

### Method 1: Using VectorPaths (Simple)
Best for simple shapes. Uses SVG path data format.

```typescript
const arrow = figma.createVector();
arrow.vectorPaths = [{
  windingRule: "NONZERO",  // or "EVENODD"
  data: "M 0 0 L 100 100"  // SVG path data
}];
```

#### Supported SVG Path Commands
```text
M x y    - Absolute "move to" command
L x y    - Absolute "line to" command
C x0 y0 x1 y1 x y  - Absolute cubic spline (Bezier curve)
Q x0 y0 x y  - Absolute quadratic spline (converts to cubic internally)
Z        - Close path command
```

#### Example: Triangle Arrow
```typescript
const triangle = figma.createVector();
triangle.vectorPaths = [{
  windingRule: "EVENODD",
  data: "M 0 100 L 100 100 L 50 0 Z"
}];
```

#### Example: Line with Path
```typescript
const line = figma.createVector();
line.vectorPaths = [{
  windingRule: "NONZERO",
  data: "M 0 0 L 200 100"  // Line from (0,0) to (200,100)
}];
```

### Method 2: Using VectorNetwork (Complex)
Better for complex geometry with multiple vertices and segments.

```typescript
const vector = figma.createVector();
vector.vectorNetwork = {
  // Define vertices (points)
  vertices: [
    { x: 0, y: 100 },
    { x: 100, y: 100 },
    { x: 50, y: 0 }
  ],

  // Define segments (edges between vertices)
  segments: [
    {
      start: 0,  // Index of start vertex
      end: 1,    // Index of end vertex
      tangentStart: { x: 0, y: 0 },  // Optional: for curves
      tangentEnd: { x: 0, y: 0 }     // Optional: for curves
    },
    { start: 1, end: 2 },
    { start: 2, end: 0 }
  ],

  // Define regions (filled areas)
  regions: [
    {
      windingRule: "NONZERO",
      loops: [[0, 1, 2]]  // Indices into segments array
    }
  ]
};
```

### Updating Vector Networks Asynchronously
```typescript
// For dynamic-page access, use async method
await vector.setVectorNetworkAsync(newVectorNetwork);
```

### Creating Lines (Specialized)
```typescript
const line = figma.createLine();

// Position
line.x = 50;
line.y = 50;

// Make line 200px long (horizontal)
line.resize(200, 0);

// Style the line
line.strokeWeight = 4;
line.strokes = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];
line.strokeCap = 'ARROW_LINES';  // Built-in arrow heads!
```

### Vector Geometry Properties
```typescript
// Read-only geometry data
vector.fillGeometry    // VectorPaths - fill paths relative to node
vector.strokeGeometry  // VectorPaths - stroke paths (always from center)
```

---

## Selection Handling

### Accessing Selection
```typescript
// Get current selection
const selection = figma.currentPage.selection;

// Check selection count
if (selection.length === 2) {
  const [node1, node2] = selection;
  // Process the two selected nodes
}

// Check if selection is empty
if (selection.length === 0) {
  figma.notify('Please select at least one object');
  return;
}
```

### Modifying Selection
```typescript
// Set new selection (replace existing)
figma.currentPage.selection = [node1, node2];

// Add to existing selection
figma.currentPage.selection = figma.currentPage.selection.concat(newNode);

// Clear selection
figma.currentPage.selection = [];

// Select first child of a node
if (node.children && node.children.length > 0) {
  figma.currentPage.selection = [node.children[0]];
}
```

### Listening for Selection Changes
```typescript
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  console.log(`Selection changed: ${selection.length} objects selected`);

  // Your flow creation logic here
  if (selection.length === 2) {
    // Create flow arrow between the two selected objects
  }
});
```

---

## Event System

### Event Types
Figma provides a robust event system for monitoring changes.

```typescript
// Core event types
'run'                  // Plugin starts
'selectionchange'      // Selection changes
'currentpagechange'    // User switches pages
'documentchange'       // Document modifications
'close'                // Plugin is closing
'drop'                 // Drag & drop events
'nodechange'           // Node property changes (on PageNode)
'timerstart'           // Timer events
'textreview'           // Text review events
```

### Registering Event Listeners

#### Selection Change
```typescript
figma.on('selectionchange', () => {
  console.log('Selection changed!');
  // Runs asynchronously after the current code completes
});
```

#### Document Change (Track All Modifications)
```typescript
figma.on('documentchange', (event) => {
  for (const change of event.documentChanges) {
    switch (change.type) {
      case 'CREATE':
        console.log(`Node ${change.id} created by ${change.origin}`);
        break;

      case 'DELETE':
        console.log(`Node ${change.id} deleted by ${change.origin}`);
        break;

      case 'PROPERTY_CHANGE':
        for (const prop of change.properties) {
          console.log(`Node ${change.id} property ${prop} changed`);
        }
        break;
    }
  }
});
```

#### Page Change
```typescript
figma.on('currentpagechange', () => {
  console.log('Page changed to:', figma.currentPage.name);
});
```

#### Node Change (On Specific Page)
```typescript
// Listen for node changes on current page
figma.currentPage.on('nodechange', (event) => {
  console.log('Node change detected:', event.nodeChanges);

  // Update flow arrows when connected nodes move
  for (const change of event.nodeChanges) {
    if (change.type === 'PROPERTY_CHANGE') {
      // Recalculate flow arrow paths
    }
  }
});
```

#### Plugin Run Event (Entry Point)
```typescript
figma.on('run', ({ command, parameters }) => {
  console.log('Plugin running with command:', command);

  // Handle different commands
  switch (command) {
    case 'create-flow':
      createFlowArrow();
      break;
    case 'settings':
      showSettings();
      break;
  }
});
```

### Removing Event Listeners
```typescript
// Store function reference
const selectionHandler = () => {
  console.log('Selection changed');
};

// Add listener
figma.on('selectionchange', selectionHandler);

// Remove listener (must use same function reference!)
figma.off('selectionchange', selectionHandler);
```

### One-Time Event Listeners
```typescript
// Automatically removed after first invocation
figma.once('run', () => {
  console.log('Plugin running for the first time');
});
```

### Important Event Behavior
- **Asynchronous Execution**: Events fire after current code completes
- **Same Function Reference**: Must use identical function for `on`/`off`
- **Cleanup**: Remove listeners when plugin closes to prevent memory leaks

```typescript
// Example: Async behavior
figma.on('selectionchange', () => {
  console.log('3. Selection changed callback');
});

console.log('1. Before changing selection');
figma.currentPage.selection = [];
console.log('2. After changing selection');

// Output order:
// 1. Before changing selection
// 2. After changing selection
// 3. Selection changed callback
```

---

## UI Communication

### Plugin-UI Architecture
Figma plugins have two separate contexts:
- **Plugin Sandbox** (`code.ts`): Has access to Figma API, runs in secure sandbox
- **UI Iframe** (`ui.html`): Standard web environment, NO direct Figma API access

Communication happens via `postMessage`.

### Showing UI
```typescript
// In code.ts
figma.showUI(__html__, {
  width: 320,
  height: 400,
  visible: true,  // Set to false for background UI
  title: 'FigmaFlow Settings'
});
```

### Sending Messages: Plugin → UI
```typescript
// In code.ts (plugin sandbox)
figma.ui.postMessage({
  type: 'update-selection',
  count: figma.currentPage.selection.length,
  data: { /* any serializable data */ }
});
```

### Receiving Messages: UI → Plugin
```typescript
// In code.ts (plugin sandbox)
figma.ui.onmessage = (msg) => {
  console.log('Received from UI:', msg);

  switch (msg.type) {
    case 'create-arrow':
      createFlowArrow(msg.style, msg.options);
      break;
    case 'update-style':
      updateArrowStyle(msg.styleId, msg.properties);
      break;
    case 'close':
      figma.closePlugin();
      break;
  }
};
```

### Sending Messages: UI → Plugin
```typescript
// In ui.html
parent.postMessage({
  pluginMessage: {
    type: 'create-arrow',
    style: {
      strokeWidth: 2,
      color: '#5E5CE6',
      startTerminal: 'arrow',
      endTerminal: 'arrow'
    }
  }
}, '*');
```

### Receiving Messages: Plugin → UI
```typescript
// In ui.html
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;

  if (!msg) return;

  switch (msg.type) {
    case 'update-selection':
      updateSelectionCount(msg.count);
      break;
    case 'flow-created':
      showSuccessMessage(`Flow arrow created: ${msg.flowId}`);
      break;
  }
};
```

### Complete Communication Example
```typescript
// code.ts
figma.showUI(__html__, { width: 300, height: 400 });

// Listen for selection changes and notify UI
figma.on('selectionchange', () => {
  figma.ui.postMessage({
    type: 'selection-changed',
    count: figma.currentPage.selection.length,
    nodes: figma.currentPage.selection.map(n => ({
      id: n.id,
      name: n.name,
      type: n.type
    }))
  });
});

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-flow') {
    const flowId = await createFlowArrow(msg.config);
    figma.ui.postMessage({
      type: 'flow-created',
      flowId: flowId,
      success: true
    });
  }
};
```

```html
<!-- ui.html -->
<script>
  // Send message to plugin
  document.getElementById('createBtn').onclick = () => {
    parent.postMessage({
      pluginMessage: {
        type: 'create-flow',
        config: {
          strokeWidth: 2,
          color: '#5E5CE6'
        }
      }
    }, '*');
  };

  // Receive messages from plugin
  window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    if (msg.type === 'selection-changed') {
      document.getElementById('count').textContent = msg.count;
    }
  };
</script>
```

---

## Stroke & Fill Styling

### Basic Fill & Stroke
```typescript
const node = figma.createRectangle();

// Set fill color
node.fills = [{
  type: 'SOLID',
  color: { r: 0.36, g: 0.36, b: 0.90 }  // #5E5CE6
}];

// Set stroke color
node.strokes = [{
  type: 'SOLID',
  color: { r: 0.19, g: 0.79, b: 0.91 }  // #30C9E8
}];

// Stroke weight (thickness)
node.strokeWeight = 2;

// Stroke alignment
node.strokeAlign = 'CENTER';  // 'INSIDE' | 'OUTSIDE'
```

### Stroke Properties
```typescript
// Stroke weight
node.strokeWeight = 4;  // Pixels, can be fractional

// Stroke join (corners)
node.strokeJoin = 'MITER';  // 'ROUND' | 'BEVEL'

// Stroke cap (line ends)
node.strokeCap = 'NONE';     // 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL'

// Dash pattern (for dashed lines)
node.dashPattern = [8, 4];   // [dash length, gap length] in pixels
node.dashPattern = [4, 4, 1, 4];  // More complex patterns

// Miter limit (for sharp corners)
node.strokeMiterLimit = 4;

// Stroke alignment
node.strokeAlign = 'CENTER';  // 'INSIDE' | 'OUTSIDE'
```

### Individual Stroke Weights (Rectangles/Frames)
```typescript
const rect = figma.createRectangle();

// Set different weights for each side
rect.strokeTopWeight = 2;
rect.strokeBottomWeight = 4;
rect.strokeLeftWeight = 1;
rect.strokeRightWeight = 3;

// Set all to same value
rect.strokeWeight = 2;  // Applies to all sides

// Hide stroke on specific side
rect.strokeLeftWeight = 0;
```

### Stroke Cap Types (Arrow Heads!)
```typescript
const line = figma.createLine();
line.resize(200, 0);
line.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
line.strokeWeight = 3;

// Built-in arrow styles
line.strokeCap = 'NONE';                  // Plain line ends
line.strokeCap = 'ROUND';                 // Rounded caps
line.strokeCap = 'SQUARE';                // Square caps
line.strokeCap = 'ARROW_LINES';           // Line arrow heads
line.strokeCap = 'ARROW_EQUILATERAL';     // Triangle arrow heads
```

### Gradient Fills
```typescript
node.fills = [{
  type: 'GRADIENT_LINEAR',
  gradientHandlePositions: [
    { x: 0, y: 0.5 },     // Start point
    { x: 1, y: 0.5 },     // End point
    { x: 0.5, y: 0.5 }    // Width point
  ],
  gradientStops: [
    { position: 0, color: { r: 1, g: 0.4, b: 0.4, a: 1 } },
    { position: 1, color: { r: 1, g: 0.7, b: 0.4, a: 1 } }
  ]
}];

// Other gradient types
// 'GRADIENT_RADIAL'
// 'GRADIENT_ANGULAR'
// 'GRADIENT_DIAMOND'
```

### Paint Styles
```typescript
// Link to paint style (for consistency)
node.fillStyleId = 'style-id-here';
node.strokeStyleId = 'style-id-here';

// Async methods for dynamic-page access
await node.setFillStyleIdAsync('style-id');
await node.setStrokeStyleIdAsync('style-id');

// Check current style
console.log(node.fillStyleId);  // string or figma.mixed
console.log(node.strokeStyleId);
```

### Opacity
```typescript
node.opacity = 0.5;  // 0 to 1
```

### Color Format
```typescript
// Figma uses RGB values from 0 to 1
const color = {
  r: 1,      // Red: 255 / 255 = 1
  g: 0.5,    // Green: 128 / 255 = 0.5
  b: 0,      // Blue: 0 / 255 = 0
  a: 1       // Alpha (optional): 1 = fully opaque
};

// Helper function: Convert hex to Figma color
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

// Usage
node.fills = [{ type: 'SOLID', color: hexToRgb('#5E5CE6') }];
```

---

## Data Storage

### Plugin-Private Data
Store data that only your plugin can access.

```typescript
// Store data on a node
node.setPluginData('flowConnectionId', 'flow-123');
node.setPluginData('flowConfig', JSON.stringify({
  sourceNodeId: 'node-1',
  targetNodeId: 'node-2',
  style: 'dashed'
}));

// Retrieve data
const connectionId = node.getPluginData('flowConnectionId');
const config = JSON.parse(node.getPluginData('flowConfig') || '{}');

// Get all keys
const keys = node.getPluginDataKeys();
console.log('Stored keys:', keys);  // ['flowConnectionId', 'flowConfig']
```

### Shared Plugin Data
Store data that all plugins can access (use with caution).

```typescript
// Store shared data (with namespace)
node.setSharedPluginData('com.figmaflow', 'flowId', 'flow-123');

// Retrieve shared data
const flowId = node.getSharedPluginData('com.figmaflow', 'flowId');

// Get all keys in namespace
const keys = node.getSharedPluginDataKeys('com.figmaflow');
```

### Size Limits
- **Maximum size per entry**: 100 kB (namespace + key + value combined)
- Store complex data as JSON strings
- Use multiple keys for large datasets

### Best Practices for FigmaFlow
```typescript
// Store connection data on both nodes
interface FlowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  arrowNodeId: string;
  style: {
    strokeWidth: number;
    strokeColor: string;
    startTerminal: string;
    endTerminal: string;
  };
}

function storeFlowConnection(
  sourceNode: SceneNode,
  targetNode: SceneNode,
  arrowNode: VectorNode,
  connection: FlowConnection
) {
  const data = JSON.stringify(connection);

  // Store on source node
  sourceNode.setPluginData(`flow-${connection.id}`, data);

  // Store on target node
  targetNode.setPluginData(`flow-${connection.id}`, data);

  // Store on arrow node
  arrowNode.setPluginData('flowConnection', data);
}

function getFlowConnections(node: SceneNode): FlowConnection[] {
  const keys = node.getPluginDataKeys();
  return keys
    .filter(key => key.startsWith('flow-'))
    .map(key => JSON.parse(node.getPluginData(key)))
    .filter(Boolean);
}
```

---

## Best Practices

### Performance

#### 1. Batch Operations
```typescript
// Bad: Multiple individual operations
for (let i = 0; i < 100; i++) {
  const node = figma.createRectangle();
  node.x = i * 10;
  node.y = i * 10;
  figma.currentPage.appendChild(node);
}

// Good: Batch appendChild
const nodes = [];
for (let i = 0; i < 100; i++) {
  const node = figma.createRectangle();
  node.x = i * 10;
  node.y = i * 10;
  nodes.push(node);
}
figma.currentPage.append(...nodes);
```

#### 2. Debounce Updates
```typescript
let updateTimeout: number | null = null;

figma.on('nodechange', (event) => {
  // Clear existing timeout
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  // Wait 100ms after movement stops before updating
  updateTimeout = setTimeout(() => {
    updateFlowArrows(event);
  }, 100);
});
```

#### 3. Cache Calculations
```typescript
const pathCache = new Map<string, VectorPath>();

function getOrCalculatePath(sourceId: string, targetId: string): VectorPath {
  const cacheKey = `${sourceId}-${targetId}`;

  if (pathCache.has(cacheKey)) {
    return pathCache.get(cacheKey)!;
  }

  const path = calculatePath(sourceId, targetId);
  pathCache.set(cacheKey, path);
  return path;
}
```

### Error Handling
```typescript
try {
  const selection = figma.currentPage.selection;

  if (selection.length !== 2) {
    figma.notify('Please select exactly 2 objects', { error: true });
    return;
  }

  const [source, target] = selection;
  await createFlowArrow(source, target);

  figma.notify('✓ Flow arrow created successfully');

} catch (error) {
  console.error('Error creating flow:', error);
  figma.notify(`Error: ${error.message}`, { error: true });
}
```

### Type Safety with TypeScript
```typescript
// Use type guards
function isValidNode(node: BaseNode): node is SceneNode {
  return 'x' in node && 'y' in node;
}

// Type assertions when necessary
const node = figma.currentPage.selection[0] as VectorNode;

// Handle mixed values
if (node.strokeWeight === figma.mixed) {
  console.log('Node has mixed stroke weights');
} else {
  console.log('Stroke weight:', node.strokeWeight);
}
```

### Memory Management
```typescript
// Clean up event listeners when plugin closes
const listeners = new Set<() => void>();

function addListener(event: string, callback: () => void) {
  figma.on(event, callback);
  listeners.add(() => figma.off(event, callback));
}

figma.on('close', () => {
  // Remove all listeners
  listeners.forEach(cleanup => cleanup());
  listeners.clear();
});
```

### Testing & Debugging
```typescript
// Use console.log for debugging
console.log('Plugin started');
console.log('Selection:', figma.currentPage.selection);

// Notify users of plugin actions
figma.notify('Processing...', { timeout: 2000 });

// Error notifications
figma.notify('An error occurred', { error: true });

// Close plugin with message
figma.closePlugin('Flow arrows created successfully!');
```

---

## Key Figma API Patterns for FigmaFlow

### 1. Selection-Based Flow Creation
```typescript
let selectedNodes: SceneNode[] = [];

figma.on('selectionchange', () => {
  selectedNodes.push(...figma.currentPage.selection);

  // When 2 objects are selected
  if (selectedNodes.length === 2) {
    createFlowArrow(selectedNodes[0], selectedNodes[1]);
    selectedNodes = [];
  }
});
```

### 2. Dynamic Arrow Updates
```typescript
figma.currentPage.on('nodechange', (event) => {
  for (const change of event.nodeChanges) {
    if (change.type === 'PROPERTY_CHANGE' &&
        change.properties.includes('x' || 'y' || 'width' || 'height')) {

      // Get flow connections for this node
      const node = figma.getNodeById(change.id);
      if (node) {
        updateConnectedFlows(node);
      }
    }
  }
});

function updateConnectedFlows(node: SceneNode) {
  const connections = getFlowConnections(node);
  connections.forEach(conn => {
    const arrow = figma.getNodeById(conn.arrowNodeId) as VectorNode;
    if (arrow) {
      // Recalculate and update arrow path
      arrow.vectorPaths = calculateArrowPath(conn);
    }
  });
}
```

### 3. Keyboard Shortcut Support
Implement in your UI (keyboard shortcuts aren't directly available in plugin sandbox):

```typescript
// In ui.html
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + Alt + P
  if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === 'p') {
    e.preventDefault();
    parent.postMessage({
      pluginMessage: { type: 'quick-connect' }
    }, '*');
  }
});
```

---

## Useful Resources

### Official Documentation
- **Main Plugin Docs**: https://developers.figma.com/docs/plugins/
- **API Reference**: https://developers.figma.com/docs/plugins/api/api-reference/
- **Manifest Guide**: https://developers.figma.com/docs/plugins/manifest/

### TypeScript Typings
```bash
npm install --save-dev @figma/plugin-typings
```

### Community Resources
- Figma Plugin Community: https://www.figma.com/community/plugins
- Figma Developers Discord
- GitHub: `figma/plugin-samples`

---

## Quick Reference: Common Tasks

### Create a Flow Arrow
```typescript
function createFlowArrow(source: SceneNode, target: SceneNode) {
  const arrow = figma.createVector();

  // Calculate path (simplified)
  const path = `M ${source.x + source.width} ${source.y + source.height/2}
                L ${target.x} ${target.y + target.height/2}`;

  arrow.vectorPaths = [{
    windingRule: 'NONZERO',
    data: path
  }];

  // Style
  arrow.strokes = [{ type: 'SOLID', color: hexToRgb('#5E5CE6') }];
  arrow.strokeWeight = 2;
  arrow.strokeCap = 'ARROW_LINES';

  // Store connection data
  arrow.setPluginData('connection', JSON.stringify({
    sourceId: source.id,
    targetId: target.id
  }));

  figma.currentPage.appendChild(arrow);
  return arrow;
}
```

### Monitor Selection for Two Objects
```typescript
const pendingSelection: SceneNode[] = [];

figma.on('selectionchange', () => {
  pendingSelection.push(...figma.currentPage.selection);

  if (pendingSelection.length >= 2) {
    const [source, target] = pendingSelection.splice(0, 2);
    createFlowArrow(source, target);
  }
});
```

### Update Arrows When Nodes Move
```typescript
figma.on('documentchange', (event) => {
  for (const change of event.documentChanges) {
    if (change.type === 'PROPERTY_CHANGE') {
      const node = figma.getNodeById(change.id);
      if (node) {
        updateFlowsForNode(node as SceneNode);
      }
    }
  }
});
```

---

## Important Notes

1. **All Figma API methods are asynchronous** - Use `async/await` where needed
2. **Browser-based sandbox** - No direct file system or Node.js access
3. **User-initiated** - Plugins cannot auto-run on file open
4. **TypeScript strongly recommended** - Better type safety and autocomplete
5. **Size limits** - Plugin data limited to 100 kB per entry
6. **No version rollback** - Users cannot downgrade after updates

---

**Happy Coding! 🎨**

*This reference was compiled from official Figma Plugin API documentation (January 2025) to support the development of FigmaFlow - the unlimited, open-source flow diagram plugin.*
