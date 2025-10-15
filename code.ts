// FigmaFlow - Main Plugin Code
// This is the backend code that runs in the Figma plugin sandbox

// Show the plugin UI
figma.showUI(__html__, { width: 320, height: 600 });

// Store active connections
interface FlowConnection {
  id: string;
  vectorNode: VectorNode;
  source: {
    nodeId: string;
    edge: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    offset: number;
  };
  target: {
    nodeId: string;
    edge: 'auto' | 'top' | 'bottom' | 'left' | 'right';
    offset: number;
  };
  style: {
    strokeColor: RGB;
    strokeWidth: number;
    dashPattern: number[];
    startTerminal: string;
    endTerminal: string;
  };
}

let connections: FlowConnection[] = [];
let isActive = true;
let previousSelection: readonly SceneNode[] = [];

// Listen for selection changes
figma.on('selectionchange', () => {
  if (!isActive) return;

  const selection = figma.currentPage.selection;

  // Check if user is holding shift and selecting two objects
  if (selection.length === 2 && previousSelection.length === 1) {
    // User selected a second object - create connection
    const source = previousSelection[0];
    const target = selection[1];

    if (source && target && source.id !== target.id) {
      createFlowConnection(source, target);
    }
  }

  previousSelection = [...selection];
});

// Create a flow connection between two nodes
function createFlowConnection(source: SceneNode, target: SceneNode) {
  // Get the bounds of both objects
  const sourceBounds = getNodeBounds(source);
  const targetBounds = getNodeBounds(target);

  if (!sourceBounds || !targetBounds) return;

  // Calculate connection points (center to center for now)
  const startPoint = {
    x: sourceBounds.x + sourceBounds.width / 2,
    y: sourceBounds.y + sourceBounds.height / 2,
  };

  const endPoint = {
    x: targetBounds.x + targetBounds.width / 2,
    y: targetBounds.y + targetBounds.height / 2,
  };

  // Create vector for the arrow
  const arrow = figma.createVector();
  arrow.name = `Flow: ${source.name} → ${target.name}`;

  // Create a simple path from start to end
  const path = createArrowPath(startPoint, endPoint);
  arrow.vectorPaths = [path];

  // Style the arrow
  arrow.strokes = [{
    type: 'SOLID',
    color: { r: 0.369, g: 0.361, b: 0.902 }, // #5E5CE6
  }];
  arrow.strokeWeight = 2;
  arrow.strokeCap = 'ARROW_LINES';

  // Add to current page
  figma.currentPage.appendChild(arrow);

  // Store connection
  const connection: FlowConnection = {
    id: arrow.id,
    vectorNode: arrow,
    source: {
      nodeId: source.id,
      edge: 'auto',
      offset: 0,
    },
    target: {
      nodeId: target.id,
      edge: 'auto',
      offset: 0,
    },
    style: {
      strokeColor: { r: 0.369, g: 0.361, b: 0.902 },
      strokeWidth: 2,
      dashPattern: [],
      startTerminal: 'none',
      endTerminal: 'arrow',
    },
  };

  connections.push(connection);

  figma.notify(`Flow created: ${source.name} → ${target.name}`);
}

// Create a simple arrow path
function createArrowPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const path: VectorPath = {
    windingRule: 'NONZERO',
    data: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
  };
  return path;
}

// Get node bounds
function getNodeBounds(node: SceneNode): { x: number; y: number; width: number; height: number } | null {
  if ('absoluteBoundingBox' in node && node.absoluteBoundingBox) {
    return {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height,
    };
  }
  return null;
}

// Handle messages from UI
figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case 'toggle-active':
      isActive = msg.active;
      figma.notify(isActive ? 'FigmaFlow activated' : 'FigmaFlow paused');
      break;

    case 'clear-all':
      connections.forEach((conn) => {
        try {
          conn.vectorNode.remove();
        } catch (e) {
          // Node might already be deleted
        }
      });
      connections = [];
      figma.notify('All flows cleared');
      break;

    case 'get-stats':
      figma.ui.postMessage({
        type: 'stats-update',
        count: connections.length,
        isActive,
      });
      break;

    default:
      break;
  }
};

// Send initial stats
figma.ui.postMessage({
  type: 'stats-update',
  count: connections.length,
  isActive,
});
