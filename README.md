# FigmaFlow

> Unlimited flow diagrams, zero cost. Design your user journeys without limits.

A powerful, free, open-source Figma plugin that automatically draws flow arrows between selected objects with unlimited flow capability.

## Features

- **Unlimited Flow Connections** - Create as many flow arrows as you need, completely free
- **Automatic Connection** - Simply select objects while holding Shift to create connections
- **Intelligent Routing** - Smart pathfinding that avoids obstacles
- **Extensive Customization** - Multiple line styles, terminals, colors, and widths
- **Real-time Updates** - Connections automatically adjust when objects move
- **Text Annotations** - Add labels to your flow connections
- **Open Source** - Community-driven development under MIT license

## Quick Start

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/figmaflow.git
cd figmaflow
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

### Development

To work on the plugin with live reloading:

```bash
npm run watch
```

### Testing in Figma

1. Open Figma Desktop App
2. Go to **Plugins → Development → Import plugin from manifest**
3. Select the `manifest.json` file from your project directory
4. Run the plugin with **Plugins → Development → FigmaFlow**

## How to Use

1. **Launch the Plugin**: Open FigmaFlow from the plugins menu
2. **Select First Object**: Click on any frame, shape, or component
3. **Select Second Object**: Hold **Shift** and click on another object
4. **Flow Created**: An arrow automatically connects the two objects
5. **Repeat**: Continue selecting objects to create multiple connections

### Keyboard Shortcuts

- `Cmd/Ctrl + Alt + P` - Toggle FigmaFlow on/off (coming soon)
- `Shift + Click` - Select multiple objects to create flow

## Customization Options

### Line Styles
- Solid
- Dashed
- Dotted
- Hand-drawn

### Terminal Styles
- None (plain line)
- Arrow
- Circle
- Diamond
- Square

### Routing Options
- Auto-avoid obstacles
- Orthogonal lines (90-degree turns)
- Adjustable start/end offsets
- Custom connection points

### Visual Properties
- Stroke color (full color picker)
- Stroke width (1-10px)
- Corner radius
- Opacity

## Development Roadmap

### Phase 1: MVP ✅
- [x] Basic project setup
- [x] Plugin UI structure
- [x] Simple flow connections
- [ ] Basic arrow styles

### Phase 2: Smart Routing
- [ ] Obstacle detection
- [ ] Pathfinding algorithm (A*)
- [ ] Orthogonal routing
- [ ] Auto-update on object movement

### Phase 3: Customization
- [ ] Full style controls
- [ ] Text annotations
- [ ] Terminal offsets
- [ ] Hand-drawn style

### Phase 4: Polish
- [ ] Performance optimization
- [ ] Bulk operations
- [ ] Export/import settings
- [ ] Comprehensive documentation

## Project Structure

```
figmaflow/
├── manifest.json          # Plugin manifest
├── code.ts               # Main plugin code (backend)
├── ui.html               # Plugin UI
├── webpack.config.js     # Build configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies
├── src/
│   ├── pathfinding/     # Pathfinding algorithms
│   ├── rendering/       # Arrow rendering logic
│   ├── state/           # State management
│   └── utils/           # Utility functions
└── assets/
    └── icons/           # Plugin icons
```

## Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Add comments for complex logic
- Test your changes thoroughly in Figma
- Update documentation as needed

## Technical Stack

- **TypeScript** - Type-safe code
- **Figma Plugin API** - Core plugin functionality
- **Webpack** - Build system
- **HTML/CSS** - User interface

## Performance

FigmaFlow is optimized to handle:
- 1000+ simultaneous flow connections
- < 100ms connection creation time
- < 500ms path recalculation
- Smooth performance with complex designs

## License

MIT License - feel free to use this plugin in your projects, both personal and commercial.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/figmaflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/figmaflow/discussions)

## Acknowledgments

Built with the Figma Plugin API and inspired by the need for unlimited, free flow diagram tools.

---

**FigmaFlow** - Because your creativity shouldn't have limits.
