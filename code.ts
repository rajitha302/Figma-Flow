// FigmaFlow - Main Plugin Code
// This is the backend code that runs in the Figma plugin sandbox

// Show the plugin UI
figma.showUI(__html__, { width: 320, height: 600 });

// Store active connections
interface FlowConnection {
  id: string;
  vectorNode: VectorNode;
  decorationNodes: SceneNode[]; // Track terminal decorations
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
let currentStyle = {
  lineType: 'solid',
  strokeColor: { r: 0, g: 0, b: 0 }, // Black like Autoflow
  strokeWidth: 20,
  startTerminal: 'none',
  endTerminal: 'arrow',
  startOffset: 20, // Default offset like Autoflow
  endOffset: 20,
};

let routingSettings = {
  orthogonalOnly: true, // Default to orthogonal routing
  autoAvoidObstacles: true, // Default to obstacle avoidance
  cornerRadius: 8, // Default corner radius in pixels
};

// Track node positions for auto-update
let nodePositions = new Map<string, { x: number; y: number }>();
let isUpdating = false; // Prevent concurrent updates
let trackedNodeIds = new Set<string>(); // Cache tracked node IDs

// Listen for selection changes
figma.on('selectionchange', () => {
  if (!isActive) return;

  const selection = figma.currentPage.selection;

  // Improved Shift+Click detection logic:
  // When user shifts from 1 selected to 2 selected, create connection
  // This happens when user holds Shift and clicks a second object
  if (selection.length === 2 && previousSelection.length === 1) {
    // Find which node was added (the new selection)
    const previousIds = new Set(previousSelection.map(n => n.id));
    const newNode = selection.find(n => !previousIds.has(n.id));
    const existingNode = selection.find(n => previousIds.has(n.id));

    if (newNode && existingNode) {
      createFlowConnection(existingNode, newNode);
    }
  }
  // Also support selecting 2 objects at once (box select with Shift)
  else if (selection.length === 2 && previousSelection.length === 0) {
    createFlowConnection(selection[0], selection[1]);
  }

  previousSelection = [...selection];
});

// Rebuild tracked node IDs cache
function rebuildTrackedNodeIds() {
  trackedNodeIds.clear();
  for (const connection of connections) {
    trackedNodeIds.add(connection.source.nodeId);
    trackedNodeIds.add(connection.target.nodeId);
  }
}

// Monitor node changes for auto-update
// Maximum performance version - instant updates with no debouncing
figma.on('documentchange', (event) => {
  if (!isActive || connections.length === 0 || isUpdating) return;

  // Fast check: look for changed nodes
  const changedNodeIds = new Set<string>();

  for (const change of event.documentChanges) {
    if (change.type === 'PROPERTY_CHANGE') {
      // Quick lookup in cached set
      if (!trackedNodeIds.has(change.id)) continue;

      // Only check critical properties
      if (change.properties.includes('x') ||
          change.properties.includes('y') ||
          change.properties.includes('width') ||
          change.properties.includes('height')) {
        changedNodeIds.add(change.id);
      }
    }
  }

  // Update immediately if any changes detected
  if (changedNodeIds.size > 0) {
    isUpdating = true;
    try {
      updateAffectedConnectionsFast(changedNodeIds);
    } finally {
      isUpdating = false;
    }
  }
});

// Create a flow connection between two nodes
function createFlowConnection(source: SceneNode, target: SceneNode) {
  // Get the bounds of both objects
  const sourceBounds = getNodeBounds(source);
  const targetBounds = getNodeBounds(target);

  if (!sourceBounds || !targetBounds) return;

  // Calculate intelligent edge-to-edge connection points
  const { startPoint, endPoint, startEdge, endEdge } = calculateConnectionPoints(sourceBounds, targetBounds);

  // Create vector for the arrow line
  const arrow = figma.createVector();
  arrow.name = `Flow: ${source.name} → ${target.name}`;

  // Create path with arrow heads using vector network
  if (routingSettings.orthogonalOnly) {
    // Get points for orthogonal path
    const points = getOrthogonalPathPoints(startPoint, endPoint, startEdge, endEdge);
    const network = createVectorNetworkWithArrows(
      points,
      currentStyle.startTerminal === 'arrow',
      currentStyle.endTerminal === 'arrow'
    );
    arrow.vectorNetwork = network;
  } else {
    // Straight line
    const network = createVectorNetworkWithArrows(
      [startPoint, endPoint],
      currentStyle.startTerminal === 'arrow',
      currentStyle.endTerminal === 'arrow'
    );
    arrow.vectorNetwork = network;
  }

  // IMPORTANT: After creating the vectorNetwork, we need to copy, modify strokeCaps, and reassign
  // This is the pattern that works according to Figma examples
  const networkCopy = JSON.parse(JSON.stringify(arrow.vectorNetwork));

  // Ensure all vertices have explicit strokeCap
  for (let i = 0; i < networkCopy.vertices.length; i++) {
    if (i === 0 && currentStyle.startTerminal === 'arrow') {
      networkCopy.vertices[i].strokeCap = 'ARROW_EQUILATERAL';
    } else if (i === networkCopy.vertices.length - 1 && currentStyle.endTerminal === 'arrow') {
      networkCopy.vertices[i].strokeCap = 'ARROW_EQUILATERAL';
    } else {
      networkCopy.vertices[i].strokeCap = 'NONE';
    }
  }

  // Reassign the modified network
  arrow.vectorNetwork = networkCopy;

  // Apply current style settings
  arrow.strokes = [{
    type: 'SOLID',
    color: currentStyle.strokeColor,
  }];
  arrow.strokeWeight = currentStyle.strokeWidth;

  // Apply line style (dashed, dotted, etc.)
  if (currentStyle.lineType === 'dashed') {
    arrow.dashPattern = [10, 5];
  } else if (currentStyle.lineType === 'dotted') {
    arrow.dashPattern = [2, 4];
  } else {
    arrow.dashPattern = [];
  }

  // strokeCap already set above based on terminal types - don't override it here!

  // Add to current page
  figma.currentPage.appendChild(arrow);

  // Make arrow visible and ensure it renders
  arrow.visible = true;
  arrow.locked = false;

  // IMPORTANT: Force refresh the vectorNetwork to ensure strokeCaps are applied
  // This seems to be necessary for arrow heads to appear on initial creation
  const currentNetwork = arrow.vectorNetwork;
  arrow.vectorNetwork = JSON.parse(JSON.stringify(currentNetwork));

  // Create terminal decorations if needed (only for non-arrow types)
  const decorations: SceneNode[] = [];

  if (currentStyle.startTerminal !== 'none' && currentStyle.startTerminal !== 'arrow') {
    const startDecoration = createTerminalDecoration(startPoint, currentStyle.startTerminal, currentStyle, 'start', startEdge);
    if (startDecoration) {
      figma.currentPage.appendChild(startDecoration);
      decorations.push(startDecoration);
    }
  }

  if (currentStyle.endTerminal !== 'none' && currentStyle.endTerminal !== 'arrow') {
    const endDecoration = createTerminalDecoration(endPoint, currentStyle.endTerminal, currentStyle, 'end', endEdge);
    if (endDecoration) {
      figma.currentPage.appendChild(endDecoration);
      decorations.push(endDecoration);
    }
  }

  // Store connection
  const connection: FlowConnection = {
    id: arrow.id,
    vectorNode: arrow,
    decorationNodes: decorations, // Store terminal decorations for cleanup
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

  // Store initial positions for auto-update tracking
  storeNodePosition(source);
  storeNodePosition(target);

  // Rebuild tracked node IDs cache
  rebuildTrackedNodeIds();

  figma.notify(`Flow created: ${source.name} → ${target.name}`);
}

// Ultra-fast update function - minimal overhead
function updateAffectedConnectionsFast(changedNodeIds: Set<string>) {
  for (const connection of connections) {
    // Quick check: does this connection involve a changed node?
    if (!changedNodeIds.has(connection.source.nodeId) &&
        !changedNodeIds.has(connection.target.nodeId)) {
      continue;
    }

    try {
      // Get nodes directly
      const sourceNode = figma.getNodeById(connection.source.nodeId);
      const targetNode = figma.getNodeById(connection.target.nodeId);
      if (!sourceNode || !targetNode) continue;

      const sourceBounds = getNodeBounds(sourceNode as SceneNode);
      const targetBounds = getNodeBounds(targetNode as SceneNode);
      if (!sourceBounds || !targetBounds) continue;

      // Calculate new path
      const { startPoint, endPoint, startEdge, endEdge } = calculateConnectionPoints(sourceBounds, targetBounds);

      // Fast arrow replacement
      const oldArrow = connection.vectorNode;
      const newArrow = figma.createVector();

      // Create vector network with arrow heads
      if (routingSettings.orthogonalOnly) {
        const points = getOrthogonalPathPoints(startPoint, endPoint, startEdge, endEdge);
        const network = createVectorNetworkWithArrows(
          points,
          connection.style.startTerminal === 'arrow',
          connection.style.endTerminal === 'arrow'
        );
        newArrow.vectorNetwork = network;
      } else {
        const network = createVectorNetworkWithArrows(
          [startPoint, endPoint],
          connection.style.startTerminal === 'arrow',
          connection.style.endTerminal === 'arrow'
        );
        newArrow.vectorNetwork = network;
      }

      // IMPORTANT: Apply the copy-modify-reassign pattern for strokeCaps
      const networkCopy = JSON.parse(JSON.stringify(newArrow.vectorNetwork));
      for (let i = 0; i < networkCopy.vertices.length; i++) {
        if (i === 0 && connection.style.startTerminal === 'arrow') {
          networkCopy.vertices[i].strokeCap = 'ARROW_EQUILATERAL';
        } else if (i === networkCopy.vertices.length - 1 && connection.style.endTerminal === 'arrow') {
          networkCopy.vertices[i].strokeCap = 'ARROW_EQUILATERAL';
        } else {
          networkCopy.vertices[i].strokeCap = 'NONE';
        }
      }
      newArrow.vectorNetwork = networkCopy;

      newArrow.strokes = JSON.parse(JSON.stringify(oldArrow.strokes));
      newArrow.strokeWeight = oldArrow.strokeWeight;
      newArrow.dashPattern = oldArrow.dashPattern.slice();

      // Add before removing (smoother)
      const parent = oldArrow.parent;
      if (parent && 'appendChild' in parent) {
        parent.appendChild(newArrow);
      } else {
        figma.currentPage.appendChild(newArrow);
      }

      oldArrow.remove();
      connection.vectorNode = newArrow;

      // Update decorations if needed
      if (connection.decorationNodes.length > 0) {
        updateTerminalDecorations(connection, startPoint, endPoint, startEdge, endEdge);
      }
    } catch (e) {
      // Skip errors
    }
  }
}

// Original update function (kept for compatibility)
function updateAffectedConnections(changedNodeIds: Set<string>) {
  const connectionsToUpdate: FlowConnection[] = [];

  // Find all connections that are affected by the changed nodes
  for (const connection of connections) {
    if (changedNodeIds.has(connection.source.nodeId) || changedNodeIds.has(connection.target.nodeId)) {
      connectionsToUpdate.push(connection);
    }
  }

  // Batch update all affected connections
  for (const connection of connectionsToUpdate) {
    try {
      const sourceNode = figma.getNodeById(connection.source.nodeId);
      const targetNode = figma.getNodeById(connection.target.nodeId);

      // Skip update if nodes are temporarily unavailable (being dragged)
      // Don't remove the connection - just skip this update cycle
      if (!sourceNode || !targetNode) {
        continue;
      }

      // Get updated bounds
      const sourceBounds = getNodeBounds(sourceNode as SceneNode);
      const targetBounds = getNodeBounds(targetNode as SceneNode);

      if (!sourceBounds || !targetBounds) continue;

      // Recalculate connection points
      const { startPoint, endPoint, startEdge, endEdge } = calculateConnectionPoints(sourceBounds, targetBounds);

      // Check if the vector node still exists in the document
      try {
        const vectorExists = figma.getNodeById(connection.vectorNode.id);
        if (!vectorExists) {
          continue;
        }
      } catch (e) {
        continue;
      }

      // Update the arrow path - use lightweight version without obstacle detection
      const path = routingSettings.orthogonalOnly
        ? createOrthogonalPathFast(startPoint, endPoint, startEdge, endEdge)
        : createArrowPath(startPoint, endPoint);

      // Validate path data
      if (!path || !path.data || path.data.trim().length === 0) {
        continue;
      }

      // Save old arrow properties BEFORE removing it
      const oldArrow = connection.vectorNode;
      const arrowParent = oldArrow.parent;

      // Clone styling properties (use JSON for compatibility)
      const savedStrokes = JSON.parse(JSON.stringify(oldArrow.strokes));
      const savedStrokeWeight = oldArrow.strokeWeight;
      const savedStrokeCap = oldArrow.strokeCap;
      const savedDashPattern = oldArrow.dashPattern.slice(); // Use slice() instead of spread

      // Create new arrow FIRST (faster than remove+create)
      const newArrow = figma.createVector();
      newArrow.vectorPaths = [path];
      newArrow.strokes = savedStrokes;
      newArrow.strokeWeight = savedStrokeWeight;
      newArrow.strokeCap = savedStrokeCap;
      newArrow.dashPattern = savedDashPattern;

      // Add to parent before removing old (reduces flicker)
      if (arrowParent && 'appendChild' in arrowParent) {
        arrowParent.appendChild(newArrow);
      } else {
        figma.currentPage.appendChild(newArrow);
      }

      // Now remove old arrow
      try {
        oldArrow.remove();
      } catch (e) {
        // Already removed
      }

      // Update connection reference
      connection.vectorNode = newArrow;

      // Update terminal decorations if they exist
      if (connection.decorationNodes.length > 0) {
        updateTerminalDecorations(connection, startPoint, endPoint, startEdge, endEdge);
      }

      // Update node positions in tracking
      storeNodePosition(sourceNode as SceneNode);
      storeNodePosition(targetNode as SceneNode);
    } catch (error) {
      // Handle errors silently (node might have been deleted)
    }
  }
}

// Create fast orthogonal path without obstacle detection (for real-time updates)
function createOrthogonalPathFast(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startEdge: string,
  endEdge: string
): VectorPath {
  const pathData = createBasicOrthogonalPath(start, end, startEdge, endEdge);
  return {
    windingRule: 'NONZERO',
    data: pathData,
  };
}

// Update terminal decorations positions
function updateTerminalDecorations(
  connection: FlowConnection,
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  startEdge: string,
  endEdge: string
) {
  // Terminal decorations are stored in order: [start, end]
  // Update their positions based on the current style
  const size = connection.style.strokeWidth * 2.5;

  connection.decorationNodes.forEach((decoration, index) => {
    const point = index === 0 ? startPoint : endPoint;
    const edge = index === 0 ? startEdge : endEdge;

    if ('x' in decoration && 'y' in decoration) {
      // For shapes with x/y properties (circles, rectangles)
      decoration.x = point.x - size / 2;
      decoration.y = point.y - size / 2;
    } else if ('vectorPaths' in decoration) {
      // For vector nodes (diamonds, arrows), recreate the path at new position
      const vectorDecoration = decoration as VectorNode;
      const decorationName = vectorDecoration.name;

      if (decorationName.includes('Arrow')) {
        // Update arrow decoration with proper rotation based on edge
        const arrowLength = connection.style.strokeWidth * 2;
        const arrowWidth = connection.style.strokeWidth * 1.6;

        let arrowPath: VectorPath;
        switch (edge) {
          case 'right':
            arrowPath = {
              windingRule: 'NONZERO',
              data: `M ${point.x + arrowLength} ${point.y} L ${point.x} ${point.y - arrowWidth} L ${point.x} ${point.y + arrowWidth} Z`,
            };
            break;
          case 'left':
            arrowPath = {
              windingRule: 'NONZERO',
              data: `M ${point.x - arrowLength} ${point.y} L ${point.x} ${point.y - arrowWidth} L ${point.x} ${point.y + arrowWidth} Z`,
            };
            break;
          case 'bottom':
            arrowPath = {
              windingRule: 'NONZERO',
              data: `M ${point.x} ${point.y + arrowLength} L ${point.x - arrowWidth} ${point.y} L ${point.x + arrowWidth} ${point.y} Z`,
            };
            break;
          case 'top':
            arrowPath = {
              windingRule: 'NONZERO',
              data: `M ${point.x} ${point.y - arrowLength} L ${point.x - arrowWidth} ${point.y} L ${point.x + arrowWidth} ${point.y} Z`,
            };
            break;
          default:
            arrowPath = {
              windingRule: 'NONZERO',
              data: `M ${point.x + arrowLength} ${point.y} L ${point.x} ${point.y - arrowWidth} L ${point.x} ${point.y + arrowWidth} Z`,
            };
        }
        vectorDecoration.vectorPaths = [arrowPath];
      } else if (decorationName.includes('Diamond')) {
        // Update diamond decoration
        const halfSize = size / 2;
        const diamondPath: VectorPath = {
          windingRule: 'NONZERO',
          data: `M ${point.x} ${point.y - halfSize} L ${point.x + halfSize} ${point.y} L ${point.x} ${point.y + halfSize} L ${point.x - halfSize} ${point.y} Z`,
        };
        vectorDecoration.vectorPaths = [diamondPath];
      }
    }
  });
}

// Store node position for tracking
function storeNodePosition(node: SceneNode) {
  const bounds = getNodeBounds(node);
  if (bounds) {
    nodePositions.set(node.id, { x: bounds.x, y: bounds.y });
  }
}

// Remove a connection and its decorations
function removeConnection(connection: FlowConnection) {
  try {
    connection.vectorNode.remove();
  } catch (e) {
    // Already removed
  }

  // Remove terminal decorations
  for (const decoration of connection.decorationNodes) {
    try {
      decoration.remove();
    } catch (e) {
      // Already removed
    }
  }

  connections = connections.filter(c => c.id !== connection.id);
}

// Calculate intelligent connection points (edge-to-edge)
function calculateConnectionPoints(
  sourceBounds: { x: number; y: number; width: number; height: number },
  targetBounds: { x: number; y: number; width: number; height: number }
) {
  const sourceCenter = {
    x: sourceBounds.x + sourceBounds.width / 2,
    y: sourceBounds.y + sourceBounds.height / 2,
  };
  const targetCenter = {
    x: targetBounds.x + targetBounds.width / 2,
    y: targetBounds.y + targetBounds.height / 2,
  };

  // Determine which edges to connect based on relative positions
  let startPoint = { x: 0, y: 0 };
  let endPoint = { x: 0, y: 0 };
  let startEdge = 'right';
  let endEdge = 'left';

  // Horizontal distance (left to right)
  const dx = targetCenter.x - sourceCenter.x;
  // Vertical distance (top to bottom)
  const dy = targetCenter.y - sourceCenter.y;

  // Determine best edges to connect
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection is dominant
    if (dx > 0) {
      // Target is to the right of source
      startEdge = 'right';
      endEdge = 'left';
      startPoint = {
        x: sourceBounds.x + sourceBounds.width + currentStyle.startOffset,
        y: sourceCenter.y,
      };
      endPoint = {
        x: targetBounds.x - currentStyle.endOffset,
        y: targetCenter.y,
      };
    } else {
      // Target is to the left of source
      startEdge = 'left';
      endEdge = 'right';
      startPoint = {
        x: sourceBounds.x - currentStyle.startOffset,
        y: sourceCenter.y,
      };
      endPoint = {
        x: targetBounds.x + targetBounds.width + currentStyle.endOffset,
        y: targetCenter.y,
      };
    }
  } else {
    // Vertical connection is dominant
    if (dy > 0) {
      // Target is below source
      startEdge = 'bottom';
      endEdge = 'top';
      startPoint = {
        x: sourceCenter.x,
        y: sourceBounds.y + sourceBounds.height + currentStyle.startOffset,
      };
      endPoint = {
        x: targetCenter.x,
        y: targetBounds.y - currentStyle.endOffset,
      };
    } else {
      // Target is above source
      startEdge = 'top';
      endEdge = 'bottom';
      startPoint = {
        x: sourceCenter.x,
        y: sourceBounds.y - currentStyle.startOffset,
      };
      endPoint = {
        x: targetCenter.x,
        y: targetBounds.y + targetBounds.height + currentStyle.endOffset,
      };
    }
  }

  return { startPoint, endPoint, startEdge, endEdge };
}

// Create an orthogonal (90-degree) path
function createOrthogonalPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startEdge: string,
  endEdge: string
): VectorPath {
  let pathData = '';

  // If obstacle avoidance is enabled, try to detect and route around obstacles
  if (routingSettings.autoAvoidObstacles) {
    const obstacles = detectObstacles(start, end);

    if (obstacles.length > 0) {
      // Simple obstacle avoidance: offset the midpoint
      pathData = createPathWithSimpleAvoidance(start, end, startEdge, endEdge, obstacles);
    } else {
      pathData = createBasicOrthogonalPath(start, end, startEdge, endEdge);
    }
  } else {
    pathData = createBasicOrthogonalPath(start, end, startEdge, endEdge);
  }

  return {
    windingRule: 'NONZERO',
    data: pathData,
  };
}

// Get points for orthogonal path (simplified without curves for now)
function getOrthogonalPathPoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startEdge: string,
  endEdge: string
): Array<{x: number, y: number}> {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const points: Array<{x: number, y: number}> = [];

  // Start point
  points.push(start);

  // Add intermediate points based on edge directions
  if ((startEdge === 'right' || startEdge === 'left') && (endEdge === 'left' || endEdge === 'right')) {
    // Horizontal to horizontal: use two intermediate points
    points.push({ x: midX, y: start.y });
    points.push({ x: midX, y: end.y });
  } else if ((startEdge === 'top' || startEdge === 'bottom') && (endEdge === 'top' || endEdge === 'bottom')) {
    // Vertical to vertical: use two intermediate points
    points.push({ x: start.x, y: midY });
    points.push({ x: end.x, y: midY });
  } else {
    // Mixed: one intermediate point
    if (startEdge === 'right' || startEdge === 'left') {
      points.push({ x: end.x, y: start.y });
    } else {
      points.push({ x: start.x, y: end.y });
    }
  }

  // End point
  points.push(end);

  return points;
}

// Create vector network from points (strokeCaps will be applied separately)
function createVectorNetworkWithArrows(
  points: Array<{x: number, y: number}>,
  startArrow: boolean,
  endArrow: boolean
): VectorNetwork {
  // Create vertices from points - include cornerRadius for middle vertices
  const vertices: VectorVertex[] = points.map((point, index) => {
    // Apply corner radius to middle vertices (where corners occur), not start/end
    if (index > 0 && index < points.length - 1) {
      return {
        x: point.x,
        y: point.y,
        cornerRadius: routingSettings.cornerRadius,
      };
    } else {
      return {
        x: point.x,
        y: point.y,
      };
    }
  });

  // Create segments connecting consecutive vertices
  const segments: VectorSegment[] = [];
  for (let i = 0; i < vertices.length - 1; i++) {
    segments.push({
      start: i,
      end: i + 1,
      tangentStart: { x: 0, y: 0 },
      tangentEnd: { x: 0, y: 0 },
    });
  }

  return {
    vertices: vertices,
    segments: segments,
    regions: [],
  };
}

// Apply arrow heads to vector using strokeCap (Figma's native arrow head support)
function applyArrowHeadsToVector(vector: VectorNode, startArrow: boolean, endArrow: boolean) {
  try {
    // Make a copy of the vector network
    const network = JSON.parse(JSON.stringify(vector.vectorNetwork));

    if (network.vertices && network.vertices.length >= 2) {
      // Apply strokeCap to first vertex (start)
      if (startArrow) {
        network.vertices[0].strokeCap = 'ARROW_LINES';
      } else {
        network.vertices[0].strokeCap = 'NONE';
      }

      // Apply strokeCap to last vertex (end)
      if (endArrow) {
        network.vertices[network.vertices.length - 1].strokeCap = 'ARROW_LINES';
      } else {
        network.vertices[network.vertices.length - 1].strokeCap = 'NONE';
      }

      // Assign the modified network back to the vector
      vector.vectorNetwork = network;
    }
  } catch (e) {
    // If vectorNetwork approach fails, keep the vector as is
    console.warn('Could not apply arrow heads:', e);
  }
}

// Add arrow head to the end of a path
function addArrowHeadToPath(
  pathData: string,
  endPoint: { x: number; y: number },
  endEdge: string,
  arrowSize: number
): string {
  // Calculate arrow head based on the direction (edge)
  let arrowPath = '';

  switch (endEdge) {
    case 'right':
      // Arrow pointing right
      arrowPath = ` L ${endPoint.x - arrowSize} ${endPoint.y - arrowSize} M ${endPoint.x} ${endPoint.y} L ${endPoint.x - arrowSize} ${endPoint.y + arrowSize}`;
      break;
    case 'left':
      // Arrow pointing left
      arrowPath = ` L ${endPoint.x + arrowSize} ${endPoint.y - arrowSize} M ${endPoint.x} ${endPoint.y} L ${endPoint.x + arrowSize} ${endPoint.y + arrowSize}`;
      break;
    case 'bottom':
      // Arrow pointing down
      arrowPath = ` L ${endPoint.x - arrowSize} ${endPoint.y - arrowSize} M ${endPoint.x} ${endPoint.y} L ${endPoint.x + arrowSize} ${endPoint.y - arrowSize}`;
      break;
    case 'top':
      // Arrow pointing up
      arrowPath = ` L ${endPoint.x - arrowSize} ${endPoint.y + arrowSize} M ${endPoint.x} ${endPoint.y} L ${endPoint.x + arrowSize} ${endPoint.y + arrowSize}`;
      break;
  }

  return pathData + arrowPath;
}

// Create basic orthogonal path without obstacle avoidance
// Now with rounded corners using arc commands
function createBasicOrthogonalPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startEdge: string,
  endEdge: string
): string {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const cornerRadius = routingSettings.cornerRadius; // Use corner radius from settings

  // Create path based on edge directions with rounded corners
  if ((startEdge === 'right' || startEdge === 'left') && (endEdge === 'left' || endEdge === 'right')) {
    // Horizontal to horizontal: use two segments with rounded corners
    const direction = start.y < end.y ? 1 : -1; // Determine if going down or up
    return `M ${start.x} ${start.y} L ${midX - cornerRadius} ${start.y} Q ${midX} ${start.y} ${midX} ${start.y + cornerRadius * direction} L ${midX} ${end.y - cornerRadius * direction} Q ${midX} ${end.y} ${midX + cornerRadius} ${end.y} L ${end.x} ${end.y}`;
  } else if ((startEdge === 'top' || startEdge === 'bottom') && (endEdge === 'top' || endEdge === 'bottom')) {
    // Vertical to vertical: use two segments with rounded corners
    const direction = start.x < end.x ? 1 : -1; // Determine if going right or left
    return `M ${start.x} ${start.y} L ${start.x} ${midY - cornerRadius} Q ${start.x} ${midY} ${start.x + cornerRadius * direction} ${midY} L ${end.x - cornerRadius * direction} ${midY} Q ${end.x} ${midY} ${end.x} ${midY + cornerRadius} L ${end.x} ${end.y}`;
  } else {
    // Mixed: horizontal then vertical or vice versa with rounded corner
    if (startEdge === 'right' || startEdge === 'left') {
      const directionX = start.x < end.x ? 1 : -1;
      const directionY = start.y < end.y ? 1 : -1;
      return `M ${start.x} ${start.y} L ${end.x - cornerRadius * directionX} ${start.y} Q ${end.x} ${start.y} ${end.x} ${start.y + cornerRadius * directionY} L ${end.x} ${end.y}`;
    } else {
      const directionX = start.x < end.x ? 1 : -1;
      const directionY = start.y < end.y ? 1 : -1;
      return `M ${start.x} ${start.y} L ${start.x} ${end.y - cornerRadius * directionY} Q ${start.x} ${end.y} ${start.x + cornerRadius * directionX} ${end.y} L ${end.x} ${end.y}`;
    }
  }
}

// Detect obstacles between start and end points
function detectObstacles(start: { x: number; y: number }, end: { x: number; y: number }): any[] {
  const obstacles: any[] = [];

  // Get all visible nodes on the current page
  const allNodes = figma.currentPage.findAll(node => {
    // Check if node has bounds and is visible
    if ('absoluteBoundingBox' in node && node.visible) {
      const bounds = node.absoluteBoundingBox;
      if (!bounds) return false;

      // Check if the node's bounds intersect with the path rectangle
      const pathMinX = Math.min(start.x, end.x);
      const pathMaxX = Math.max(start.x, end.x);
      const pathMinY = Math.min(start.y, end.y);
      const pathMaxY = Math.max(start.y, end.y);

      // Simple AABB intersection check
      const intersects = !(
        bounds.x > pathMaxX ||
        bounds.x + bounds.width < pathMinX ||
        bounds.y > pathMaxY ||
        bounds.y + bounds.height < pathMinY
      );

      return intersects;
    }
    return false;
  });

  return allNodes.slice(0, 5); // Limit to first 5 obstacles for performance
}

// Create path with simple obstacle avoidance
function createPathWithSimpleAvoidance(
  start: { x: number; y: number },
  end: { x: number; y: number },
  startEdge: string,
  endEdge: string,
  obstacles: any[]
): string {
  // Simple strategy: add extra clearance to the midpoint
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const clearance = 50; // Extra space to avoid obstacles

  if ((startEdge === 'right' || startEdge === 'left') && (endEdge === 'left' || endEdge === 'right')) {
    // Horizontal routing: add vertical clearance
    const offsetY = start.y < end.y ? -clearance : clearance;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${midY + offsetY} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  } else {
    // Use basic routing as fallback
    return createBasicOrthogonalPath(start, end, startEdge, endEdge);
  }
}

// Create a simple arrow path
function createArrowPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const path: VectorPath = {
    windingRule: 'NONZERO',
    data: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
  };
  return path;
}

// Create terminal decoration (circle, diamond, square)
function createTerminalDecoration(
  point: { x: number; y: number },
  type: string,
  style: any,
  direction: 'start' | 'end',
  edge: string
): SceneNode | null {
  const size = style.strokeWidth * 2.5;

  if (type === 'arrow') {
    // Create proper filled arrow terminal that rotates based on edge direction
    const arrow = figma.createVector();
    const arrowLength = style.strokeWidth * 2; // Length of arrow
    const arrowWidth = style.strokeWidth * 1.6; // Width of arrow wings

    // Create filled triangle arrow based on the edge direction
    let arrowPath: VectorPath;

    switch (edge) {
      case 'right':
        // Arrow pointing right (→)
        arrowPath = {
          windingRule: 'NONZERO',
          data: `M ${point.x + arrowLength} ${point.y} L ${point.x} ${point.y - arrowWidth} L ${point.x} ${point.y + arrowWidth} Z`,
        };
        break;
      case 'left':
        // Arrow pointing left (←)
        arrowPath = {
          windingRule: 'NONZERO',
          data: `M ${point.x - arrowLength} ${point.y} L ${point.x} ${point.y - arrowWidth} L ${point.x} ${point.y + arrowWidth} Z`,
        };
        break;
      case 'bottom':
        // Arrow pointing down (↓)
        arrowPath = {
          windingRule: 'NONZERO',
          data: `M ${point.x} ${point.y + arrowLength} L ${point.x - arrowWidth} ${point.y} L ${point.x + arrowWidth} ${point.y} Z`,
        };
        break;
      case 'top':
        // Arrow pointing up (↑)
        arrowPath = {
          windingRule: 'NONZERO',
          data: `M ${point.x} ${point.y - arrowLength} L ${point.x - arrowWidth} ${point.y} L ${point.x + arrowWidth} ${point.y} Z`,
        };
        break;
      default:
        // Default to right
        arrowPath = {
          windingRule: 'NONZERO',
          data: `M ${point.x + arrowLength} ${point.y} L ${point.x} ${point.y - arrowWidth} L ${point.x} ${point.y + arrowWidth} Z`,
        };
    }

    arrow.vectorPaths = [arrowPath];
    arrow.fills = [{ type: 'SOLID', color: style.strokeColor }];
    arrow.strokes = [];
    arrow.name = 'Terminal: Arrow';
    return arrow;
  } else if (type === 'circle') {
    const circle = figma.createEllipse();
    circle.x = point.x - size / 2;
    circle.y = point.y - size / 2;
    circle.resize(size, size);
    circle.fills = [{ type: 'SOLID', color: style.strokeColor }];
    circle.strokes = [];
    circle.name = 'Terminal: Circle';
    return circle;
  } else if (type === 'diamond') {
    // Create diamond using vector path for accurate diamond shape
    const diamond = figma.createVector();
    const halfSize = size / 2;
    // Create diamond path: top, right, bottom, left points forming a diamond
    const diamondPath: VectorPath = {
      windingRule: 'NONZERO',
      data: `M ${point.x} ${point.y - halfSize} L ${point.x + halfSize} ${point.y} L ${point.x} ${point.y + halfSize} L ${point.x - halfSize} ${point.y} Z`,
    };
    diamond.vectorPaths = [diamondPath];
    diamond.fills = [{ type: 'SOLID', color: style.strokeColor }];
    diamond.strokes = [];
    diamond.name = 'Terminal: Diamond';
    return diamond;
  } else if (type === 'square') {
    const square = figma.createRectangle();
    square.x = point.x - size / 2;
    square.y = point.y - size / 2;
    square.resize(size, size);
    square.fills = [{ type: 'SOLID', color: style.strokeColor }];
    square.strokes = [];
    square.name = 'Terminal: Square';
    return square;
  }

  return null;
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
        // Remove terminal decorations
        for (const decoration of conn.decorationNodes) {
          try {
            decoration.remove();
          } catch (e) {
            // Already removed
          }
        }
      });
      connections = [];
      nodePositions.clear();
      figma.notify('All flows cleared');
      figma.ui.postMessage({
        type: 'stats-update',
        count: 0,
        isActive,
      });
      break;

    case 'get-stats':
      figma.ui.postMessage({
        type: 'stats-update',
        count: connections.length,
        isActive,
      });
      break;

    case 'update-style':
      // Update current style from UI
      if (msg.lineType !== undefined) currentStyle.lineType = msg.lineType;
      if (msg.strokeColor !== undefined) currentStyle.strokeColor = msg.strokeColor;
      if (msg.strokeWidth !== undefined) currentStyle.strokeWidth = msg.strokeWidth;
      if (msg.startTerminal !== undefined) currentStyle.startTerminal = msg.startTerminal;
      if (msg.endTerminal !== undefined) currentStyle.endTerminal = msg.endTerminal;
      if (msg.startOffset !== undefined) currentStyle.startOffset = msg.startOffset;
      if (msg.endOffset !== undefined) currentStyle.endOffset = msg.endOffset;
      break;

    case 'update-routing':
      // Update routing settings
      if (msg.orthogonalOnly !== undefined) routingSettings.orthogonalOnly = msg.orthogonalOnly;
      if (msg.autoAvoidObstacles !== undefined) routingSettings.autoAvoidObstacles = msg.autoAvoidObstacles;
      if (msg.cornerRadius !== undefined) routingSettings.cornerRadius = msg.cornerRadius;
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
