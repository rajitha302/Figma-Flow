# FigmaFlow Development Roadmap

> Last Updated: October 15, 2025

This document tracks the implementation progress of FigmaFlow features. It will be updated as development progresses.

## 📊 Current Status

**Phase**: Phase 2 (Smart Routing) ✅ COMPLETE
**Progress**: 100% Complete

---

## ✅ Phase 1: MVP (Weeks 1-2)

### Completed Features
- [x] Project structure setup
- [x] TypeScript configuration
- [x] Webpack build system
- [x] Basic manifest.json configuration
- [x] Plugin UI scaffold (HTML/CSS)
- [x] Basic selection tracking
- [x] Simple straight-line arrow creation
- [x] Active/Paused mode toggle
- [x] Flow counter display

### In Progress
- [ ] Hand-drawn line style implementation
- [ ] UI polish and refinements

### Recently Completed (October 15, 2025)
- [x] Shift+Click selection detection (improved algorithm)
- [x] Arrow terminal styling (circle, diamond, square, arrow)
- [x] Basic stroke customization (color, width)
- [x] Multiple line style options (solid, dashed, dotted)
- [x] Color picker integration
- [x] Stroke width controls (1-10px)
- [x] Terminal decoration rendering with vector paths
- [x] **Intelligent edge-to-edge connection points**
- [x] **Orthogonal (90-degree) routing system**
- [x] **Smart edge detection based on object positions**
- [x] **Offset controls (0-100px range)**
- [x] **Autoflow-like behavior and appearance**

---

## 🚧 Phase 2: Smart Routing (Weeks 3-4)

### Completed Features
- [x] **Orthogonal Routing**
  - [x] 90-degree turn implementation
  - [x] Minimize bend count (using 2-3 segments)
  - [x] Smart edge connection points (auto-detect best edges)
- [x] **Edge-to-Edge Connection**
  - [x] Intelligent edge detection based on relative positions
  - [x] Horizontal and vertical routing support
  - [x] Configurable offsets

### Completed Features
- [x] **Obstacle Detection System**
  - [x] Detect frames and objects in canvas (AABB intersection)
  - [x] Check for path obstacles dynamically
  - [x] Filter visible nodes in path area
  - [x] Performance-optimized (limit to 5 obstacles)

- [x] **Basic Pathfinding with Avoidance**
  - [x] Simple obstacle avoidance algorithm
  - [x] Add clearance around detected obstacles
  - [x] Configurable via UI checkbox
  - [x] Works with orthogonal routing

- [x] **Auto-update on Move**
  - [x] Listen to node position changes (documentchange event)
  - [x] Debounce updates (100ms)
  - [x] Recalculate affected paths automatically
  - [x] Batch update multiple connections
  - [x] Handle node deletion gracefully

---

## 🎨 Phase 3: Customization (Weeks 5-6)

### Features to Implement
- [ ] **Full Style Controls**
  - [ ] Line types (solid, dashed, dotted, hand-drawn)
  - [ ] Color picker with presets
  - [ ] Stroke width slider (1-10px)
  - [ ] Corner radius controls
  - [ ] Opacity settings

- [ ] **Text Annotations**
  - [ ] Add labels to paths
  - [ ] Position controls (start, middle, end)
  - [ ] Auto-rotation along path
  - [ ] Background box options
  - [ ] Font customization

- [ ] **Terminal Offsets**
  - [ ] Start offset controls (0-50px)
  - [ ] End offset controls (0-50px)
  - [ ] Edge selection (top, bottom, left, right, auto)
  - [ ] Center point connection option

- [ ] **Hand-drawn Style**
  - [ ] Path perturbation algorithm
  - [ ] Sketchy appearance generator
  - [ ] Adjustable roughness

---

## ✨ Phase 4: Polish (Weeks 7-8)

### Features to Implement
- [ ] **Performance Optimization**
  - [ ] Canvas virtualization
  - [ ] Path caching system
  - [ ] Batch update optimization
  - [ ] Web worker for pathfinding
  - [ ] Throttling mechanisms

- [ ] **Bulk Operations**
  - [ ] Multi-select connections
  - [ ] Delete all flows
  - [ ] Style copying between flows
  - [ ] Batch style editing
  - [ ] Flow templates

- [ ] **Export/Import Settings**
  - [ ] Export flow data as JSON
  - [ ] Import flow configurations
  - [ ] Settings presets
  - [ ] Auto-save per file

- [ ] **Documentation**
  - [ ] User guide
  - [ ] Video tutorials
  - [ ] API documentation
  - [ ] Contributing guidelines
  - [ ] Example projects

---

## 🎯 Future Enhancements (Post-Launch)

- [ ] Keyboard shortcuts (`Cmd/Ctrl + Alt + P`)
- [ ] Custom path routing with waypoints
- [ ] Path editing with control points
- [ ] Lock path feature
- [ ] Flow templates library
- [ ] Undo/redo support
- [ ] Multiple arrow styles (curved, stepped)
- [ ] Animation preview
- [ ] Collaboration features
- [ ] Plugin parameters support
- [ ] Relaunch buttons

---

## 📝 Notes

### Technical Decisions
- Using TypeScript for type safety
- Webpack for bundling
- Browser-based plugin environment
- Asynchronous API calls throughout
- Message passing between UI and plugin code

### Known Issues
- None yet (MVP in progress)

### Dependencies
- `@figma/plugin-typings`: ^1.90.0
- `typescript`: ^5.3.3
- `webpack`: ^5.90.0
- `html-webpack-plugin`: ^5.6.0

---

## 🔗 Related Documents
- [Claude.md](Claude.md) - Full project specification
- [README.md](README.md) - User-facing documentation
- [Contributing Guidelines](CONTRIBUTING.md) - Coming soon

---

**Note**: This roadmap is a living document and will be updated as features are completed and new requirements are identified.
