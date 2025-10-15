# FigmaFlow - Development Specification

## 🎯 Project Overview
Build a powerful, free, open-source Figma plugin that automatically draws flow arrows between selected objects with unlimited flow capability.

## 🎨 Branding & Identity

### Plugin Name
**FigmaFlow** - Clear, descriptive name that immediately conveys the plugin's purpose

### Tagline
"Unlimited flow diagrams, zero cost. Design your user journeys without limits."

### Color Scheme
- Primary: #5E5CE6 (Purple - represents creativity and flow)
- Secondary: #30C9E8 (Cyan - represents connections)
- Success: #34C759 (Green)
- Text: #1D1D1F (Dark gray)

### Logo Concept
- Flowing arrow icon that forms the letters "FF"
- Clean, minimal design matching Figma's aesthetic

## 📋 Core Features

### 1. **Automatic Flow Creation**
- **Select & Connect**: Users select 2 objects while holding Shift key
- **Instant Drawing**: Arrow automatically connects selected objects
- **Keyboard Shortcut**: Implement `Cmd/Ctrl + Alt + P` for quick activation
- **Continuous Mode**: Keep selecting objects to create multiple connections

### 2. **Intelligent Path Routing**

#### Pathfinding Algorithm
- **Shortest Path Priority**: Always choose the shortest possible route
- **90-degree Bends**: Use minimal 90-degree turns (orthogonal routing)
- **Obstacle Detection**: Automatically avoid overlapping with other design elements
- **Smart Routing**: Implement A* or similar pathfinding algorithm with:
  - Grid-based navigation system
  - Collision detection for frames/objects
  - Path optimization to minimize bends

#### Implementation Approach
```javascript
// Pseudo-code for pathfinding
function findOptimalPath(startNode, endNode, obstacles) {
  // 1. Create virtual grid over canvas
  // 2. Mark obstacle zones
  // 3. Use A* algorithm to find path
  // 4. Simplify path to minimize bends
  // 5. Convert to Bezier curves or straight lines
}
```

### 3. **Arrow Styles & Customization**

#### Terminal Styles (Arrow Heads/Tails)
- None (plain line)
- Arrow (standard arrow)
- Circle (dot endpoint)
- Orthogonal (perpendicular line cap)
- Diamond
- Square

#### Line Styles
- **Solid**: Standard continuous line
- **Dashed**: Configurable dash pattern
- **Dotted**: Evenly spaced dots
- **Hand-drawn**: Rough/sketchy appearance using path perturbation

#### Visual Properties
- **Stroke Width**: 1px - 10px range
- **Stroke Color**: Full color picker
- **Corner Radius**: 0 - 20px for smooth corners
- **Opacity**: 0 - 100%

### 4. **Dynamic Updates**

#### Auto-Update System
- **Position Tracking**: Monitor connected objects' positions
- **Real-time Recalculation**: Redraw paths when objects move
- **Batch Processing**: Update multiple connections efficiently
- **Performance Optimization**: 
  - Debounce updates (wait 100ms after movement stops)
  - Cache calculated paths
  - Update only affected connections

### 5. **Text Annotations**

#### Implementation
- **Path Labels**: Add text along the flow path
- **Positioning Options**:
  - Start (near origin)
  - Middle (center of path)
  - End (near destination)
- **Auto-Rotation**: Text follows path angle
- **Background Options**: Optional background box for readability

### 6. **Offset Controls**

#### Terminal Spacing
- **Start Offset**: Distance from source object edge (0-50px)
- **End Offset**: Distance from target object edge (0-50px)
- **Edge Selection**: Choose connection point:
  - Top, Bottom, Left, Right
  - Auto (closest edges)
  - Center

### 7. **Advanced Features**

#### Pause Drawing Mode
- Toggle to temporarily disable auto-connection
- Keep plugin open while working on other elements
- Visual indicator when paused

#### Custom Path Routing
- **Manual Override**: Allow users to add waypoints
- **Path Editing**: Drag control points to adjust curves
- **Lock Path**: Prevent auto-updates for specific connections

#### Bulk Operations
- **Multi-Select**: Connect multiple objects at once
- **Delete All**: Clear all flows with one action
- **Style Copying**: Apply style from one flow to others

## 🎨 User Interface Design

### Plugin Panel Structure
```
┌─────────────────────────┐
│  FIGMAFLOW             │
├─────────────────────────┤
│ ▶ Active ○ Paused       │
├─────────────────────────┤
│ STYLE                   │
│ ┌─────────────────┐     │
│ │ Line Type: ▼    │     │
│ │ [Solid/Dashed]  │     │
│ └─────────────────┘     │
│                         │
│ Color: [████] Width: 2px│
│                         │
│ Start: [Arrow ▼]        │
│ End:   [Arrow ▼]        │
├─────────────────────────┤
│ ROUTING                 │
│ □ Auto-avoid obstacles  │
│ □ Orthogonal lines only │
│ Offset: Start [5] End[5]│
├─────────────────────────┤
│ ANNOTATIONS             │
│ □ Show labels           │
│ Position: [Middle ▼]    │
├─────────────────────────┤
│ Total Flows: ∞ Unlimited│
│ [Clear All] [Settings]  │
└─────────────────────────┘
```

## 💻 Technical Implementation

### Figma Plugin API Requirements (Updated 2025)

**Official Documentation**: https://developers.figma.com/docs/plugins/

#### Development Environment
- **Language**: JavaScript/TypeScript (TypeScript strongly recommended)
- **Runtime**: Browser-based environment
- **API Access**: Through the global `figma` object
- **Typings**: Install via `npm install --save-dev @figma/plugin-typings`

#### Essential APIs
```javascript
// Key Figma APIs to use
figma.currentPage.selection // Get selected nodes
figma.createVector() // Create arrow paths
figma.createText() // Create annotations
figma.on('selectionchange') // Monitor selection
figma.on('nodechange') // Track position changes

// Global variables available
__html__ // Access to HTML UI content
__uiFiles__ // Access to UI files
```

#### Data Structure
```javascript
// Flow connection data model
const flowConnection = {
  id: 'unique-id',
  source: { nodeId, edge, offset },
  target: { nodeId, edge, offset },
  path: { points: [], style },
  annotation: { text, position },
  style: {
    strokeColor,
    strokeWidth,
    dashPattern,
    startTerminal,
    endTerminal
  }
}
```

### Performance Optimizations

1. **Canvas Virtualization**: Only render visible flows
2. **Path Caching**: Store calculated paths
3. **Batch Updates**: Group multiple changes
4. **Throttling**: Limit update frequency
5. **Web Workers**: Offload pathfinding calculations

### Plugin Development Requirements (2025)

#### Browser Environment Considerations
- Plugins run in a browser-based sandbox environment
- All API methods are asynchronous
- Limited access to external fonts and team libraries
- Network access controlled via `networkAccess` in manifest

#### Key API Limitations
- **No Direct File System Access**: All file operations through Figma API
- **User-Initiated**: Plugins cannot run automatically on file open
- **Iframe UI**: Custom UI runs in isolated iframe context
- **No Version Rollback**: Users cannot downgrade to previous versions

#### Communication Pattern
```javascript
// Main plugin code (code.ts)
figma.ui.postMessage({ type: 'action', data: {} });

figma.ui.onmessage = (msg) => {
  // Handle messages from UI
};

// UI code (ui.html)
parent.postMessage({ pluginMessage: { type: 'action' } }, '*');

window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  // Handle messages from plugin code
};
```

## 🚀 Development Roadmap

For detailed implementation progress and feature tracking, see [ROADMAP.md](ROADMAP.md).

**Current Phase**: MVP (Phase 1) - 40% Complete

Quick overview:
- **Phase 1 (MVP)**: Basic connection system, UI scaffold, simple arrows
- **Phase 2 (Smart Routing)**: A* pathfinding, obstacle detection, auto-updates
- **Phase 3 (Customization)**: Full styling, annotations, offsets
- **Phase 4 (Polish)**: Performance optimization, bulk operations, documentation

## 🔑 Key Features & Capabilities

### Core Strengths
1. **Unlimited Flows**: No restrictions on the number of flow connections
2. **Open Source**: Community-driven development and transparency
3. **Performance**: Optimized for handling thousands of connections
4. **Customization**: Extensive styling and routing options
5. **Smart Automation**: Intelligent path finding and obstacle avoidance

### Unique Features
- Batch style editing across multiple flows
- Flow templates and presets library
- Export flow data as JSON for documentation
- Comprehensive keyboard shortcuts
- Multiple selection modes for efficiency
- Full undo/redo support for all operations
- Auto-save settings per file

## 📦 File Structure
```
figmaflow/
├── manifest.json
├── code.ts
├── ui.html
├── ui.css
├── src/
│   ├── pathfinding/
│   │   ├── algorithm.ts
│   │   ├── grid.ts
│   │   └── obstacles.ts
│   ├── rendering/
│   │   ├── arrow.ts
│   │   ├── styles.ts
│   │   └── annotations.ts
│   ├── state/
│   │   ├── connections.ts
│   │   └── settings.ts
│   └── utils/
│       ├── geometry.ts
│       └── figma-helpers.ts
└── assets/
    └── icons/
```

### Sample manifest.json (Updated 2025)

**Official Documentation**: https://developers.figma.com/docs/plugins/manifest/

#### Required Fields
```json
{
  "name": "FigmaFlow",
  "id": "figmaflow-plugin",
  "api": "1.0.0",
  "main": "dist/code.js",
  "documentAccess": "dynamic-page"
}
```

#### Full Configuration with Optional Fields
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
      "name": "Create Flow",
      "command": "create-flow"
    }
  ],
  "relaunchButtons": [
    {
      "command": "edit-flow",
      "name": "Edit Flow"
    }
  ]
}
```

#### Key Changes from Previous Versions
- **`documentAccess`**: Now REQUIRED field (must be set to "dynamic-page")
- **`permissions`**: Only include if needed (omit if empty)
- **`description`**: Not a valid field in manifest (use for Figma Community listing)
- **`version`**: Not used in manifest file
- **`networkAccess`**: Controls external network resources (important for security)
- **`editorType`**: Specify where plugin works (Figma, FigJam, Dev Mode)

## 🎯 Success Metrics
- Zero cost for users
- < 100ms connection creation time
- < 500ms path recalculation
- Support for 1000+ simultaneous flows
- Smooth performance with complex designs

## 📚 Resources & References (Updated 2025)

### Official Figma Documentation
- **Plugin Docs**: https://developers.figma.com/docs/plugins/
- **API Reference**: https://developers.figma.com/docs/plugins/api/api-reference/
- **Manifest Guide**: https://developers.figma.com/docs/plugins/manifest/
- **Plugin Typings**: `@figma/plugin-typings` (npm package)

### Technical Resources
- A* Pathfinding Algorithm implementations
- Bezier curve mathematics for smooth paths
- SVG path generation techniques
- Graph theory for optimal routing

### Best Practices from Figma
1. **Use TypeScript** - Strongly recommended for plugin development
2. **Asynchronous Methods** - Plugin API uses async operations
3. **User-Initiated Actions** - Plugins must be triggered by user
4. **Custom UI** - Create UI matching Figma's design system
5. **Error Tracking** - Implement your own analytics/error tracking
6. **Testing** - Plugins reviewed before initial publication
7. **Updates** - Can publish updates immediately after first approval

## 🚀 Quick Start Guide

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/figmaflow.git
cd figmaflow

# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes during development
npm run watch
```

### Testing in Figma
1. Open Figma Desktop App
2. Go to Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file from your project
4. Run the plugin with Plugins → Development → FigmaFlow

## 🤝 Open Source Considerations
- MIT License for maximum compatibility
- Clear contribution guidelines
- Automated testing suite
- CI/CD pipeline for releases
- Community feature requests via GitHub Issues

## 📢 Marketing & Launch Strategy

### Target Audience
1. **Primary**: UX/UI designers creating user flows
2. **Secondary**: Product teams documenting user journeys
3. **Tertiary**: Design systems teams building documentation

### Launch Channels
- **Figma Community**: Publish as featured plugin
- **Product Hunt**: Launch for maximum visibility
- **Designer Communities**: 
  - Designer News
  - Dribbble
  - Behance
  - Reddit (r/FigmaDesign, r/userexperience)
- **Social Media**: Twitter/X threads showcasing features
- **YouTube**: Tutorial videos and demos

### Key Messaging
- "Design without limits - Unlimited flows, forever free"
- "The open-source flow plugin Figma designers deserve"
- "Professional flow diagrams made simple and fast"

---

**Note**: FigmaFlow is designed to be a comprehensive, professional-grade flow diagram tool that provides unlimited capabilities without any restrictions. The focus is on performance, flexibility, and community-driven development.