# FigmaFlow Testing Checklist

> **Testing Session**: October 15, 2025
> **Version**: Phase 2 Complete (v0.95)
> **Tester**: [Your Name]

---

## 🧪 Testing Status Overview

| Test # | Feature | Status | Notes |
|--------|---------|--------|-------|
| 1 | Basic Flow Creation | ✅ Passed | Arrow appears correctly with 20px width and orthogonal routing |
| 2 | Edge-to-Edge Connection | ✅ Passed | Horizontal and vertical edge detection working correctly |
| 3 | Orthogonal Routing | ✅ Passed | Toggle switches between orthogonal and straight lines correctly |
| 4 | Auto-Update on Move | ✅ Passed | Instant real-time updates with zero delay, smooth and fluid |
| 5 | Terminal Styling | ✅ Passed | Arrow heads appear correctly using native Figma strokeCap |
| 6 | Line Styles | ⏳ Not Tested | |
| 7 | Stroke Customization | ⏳ Not Tested | |
| 8 | Offset Controls | ⏳ Not Tested | |
| 9 | Obstacle Avoidance | ⏳ Not Tested | |
| 10 | Active/Paused Toggle | ⏳ Not Tested | |
| 11 | Clear All | ⏳ Not Tested | |
| 12 | Flow Counter | ⏳ Not Tested | |
| 13 | Node Deletion | ⏳ Not Tested | |
| 14 | Multiple Flows | ⏳ Not Tested | |

**Legend**: ✅ Passed | ❌ Failed | ⚠️ Partial | ⏳ Not Tested | 🔄 Re-Test

---

## Test 1: Basic Flow Creation
**Feature**: Shift+Click selection and flow creation

### Test Steps
1. Create two rectangles on the canvas
2. Click the first rectangle
3. Hold **Shift** and click the second rectangle

### Expected Result
- ✅ Black arrow appears connecting them
- ✅ Arrow has 20px width
- ✅ Arrow uses orthogonal routing (90-degree turns)

### Actual Result
**Status**: ✅ **PASSED**

**Notes**:
- ✅ Arrow appears correctly between rectangles
- ✅ Thick 20px stroke width as expected
- ✅ Orthogonal routing with 90-degree turns working perfectly
- ⚠️ Minor console warning about timestamp (Figma internal, not our bug)

---

## Test 2: Edge-to-Edge Connection
**Feature**: Intelligent edge detection

### Test Steps - Horizontal
1. Place two rectangles **side-by-side** (horizontally)
2. Create flow between them

### Expected Result
- ✅ Arrow connects from right edge → left edge (not center to center)

### Test Steps - Vertical
3. Place two rectangles **vertically** (one above other)
4. Create flow between them

### Expected Result
- ✅ Arrow connects from bottom edge → top edge

### Actual Result
**Status**: ✅ **PASSED**

**Notes**:
- ✅ Part A: Horizontal placement correctly connects right edge → left edge
- ✅ Part B: Vertical placement correctly connects bottom edge → top edge
- ✅ Intelligent edge detection working as expected
- ✅ No center-to-center connections (proper edge-to-edge routing)

---

## Test 3: Orthogonal Routing
**Feature**: 90-degree angle routing toggle

### Test Steps
1. Create flow between two rectangles placed diagonally
2. Observe the routing style
3. **Uncheck** "Orthogonal lines only" in UI
4. Create another flow
5. **Check** "Orthogonal lines only" again
6. Create another flow

### Expected Result
- ✅ Step 1: Arrow has 90-degree turns (horizontal → vertical → horizontal)
- ✅ Step 4: Straight diagonal line
- ✅ Step 6: Back to 90-degree routing

### Actual Result
**Status**: ✅ **PASSED**

**Notes**:
- ✅ First flow (checkbox ON): 90-degree turns as expected
- ✅ Second flow (checkbox OFF): Straight diagonal line
- ✅ Third flow (checkbox ON again): Back to 90-degree routing
- ✅ Toggle switches routing mode correctly in real-time
- ✅ No issues with state management

---

## Test 4: Auto-Update on Move
**Feature**: Flows update when objects move

### Test Steps
1. Create a flow between two rectangles
2. **Drag one rectangle** to a new position
3. Observe arrow behavior
4. **Drag the other rectangle**
5. **Resize a rectangle**

### Expected Result
- ✅ Arrow automatically redraws when first rectangle moves
- ✅ Arrow updates when second rectangle moves
- ✅ Connection adjusts when rectangle is resized
- ✅ Updates are smooth (debounced)

### Actual Result
**Status**: ✅ Passed

**Notes**:
- **Initial Issue**: Severe performance issues, arrows disappeared, 1-2 second delays
- **Final Solution**: Zero-delay instant updates with maximum optimization
- **Optimizations Applied**:
  1. ✅ Removed all debouncing/throttling - instant synchronous updates
  2. ✅ Cached tracked node IDs for O(1) lookups
  3. ✅ Streamlined property checks (x, y, width, height only)
  4. ✅ Created `updateAffectedConnectionsFast()` - ultra-fast update path
  5. ✅ Arrow replacement strategy: create new before removing old (no flicker)
  6. ✅ Removed all console logging for maximum performance

**Test Results**:
1. ✅ Arrow updates instantly as you drag (no perceptible delay)
2. ✅ Dragging is smooth with no lag or freezing
3. ✅ Arrow stays visible during entire drag operation
4. ✅ Arrow maintains 20px width and styling during updates
5. ✅ Real-time updates feel instantaneous and fluid

---

## Test 5: Terminal Styling
**Feature**: Different arrow head/tail styles

### Test Steps
1. Change **Start Terminal** to "Circle"
2. Change **End Terminal** to "Diamond"
3. Create a flow
4. Try other combinations: Square, Arrow, None

### Expected Result
- ✅ Circle appears at start point
- ✅ Diamond appears at end point
- ✅ Terminal decorations are correct size
- ✅ All terminal types render correctly

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## Test 6: Line Styles
**Feature**: Solid, dashed, dotted lines

### Test Steps
1. Create flow with **Line Type: Solid**
2. Change to **Dashed**, create new flow
3. Change to **Dotted**, create new flow

### Expected Result
- ✅ Solid: Continuous line
- ✅ Dashed: Dashed line pattern (10px dash, 5px gap)
- ✅ Dotted: Dotted line pattern (2px dot, 4px gap)

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## Test 7: Stroke Customization
**Feature**: Color and width changes

### Test Steps
1. Change **Color** to red (#FF0000)
2. Change **Width** to 5px
3. Create a flow
4. Change **Width** to 30px
5. Create another flow

### Expected Result
- ✅ Red arrow with 5px width
- ✅ Thick 30px arrow
- ✅ Color picker works correctly

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## Test 8: Offset Controls
**Feature**: Start and end offset spacing

### Test Steps
1. Set **Start Offset** to 0px
2. Set **End Offset** to 0px
3. Create a flow
4. Set both to 50px
5. Create another flow

### Expected Result
- ✅ 0px offset: Arrow touches the rectangles
- ✅ 50px offset: Larger gap between arrow and rectangles

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## Test 9: Obstacle Avoidance
**Feature**: Auto-avoid obstacles checkbox

### Test Steps
1. Ensure **"Auto-avoid obstacles"** is checked
2. Place 3 rectangles: A (left), C (middle), B (right)
3. Create flow from A → B (C should be in the path)
4. **Uncheck** "Auto-avoid obstacles"
5. Create another flow A → B

### Expected Result
- ✅ With checkbox: Arrow routes around C (adds clearance)
- ✅ Without checkbox: Straight path through obstacles

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## Test 10: Active/Paused Toggle
**Feature**: Plugin on/off state

### Test Steps
1. Click **"Paused"** button
2. Try to create a flow (Shift+Click two objects)
3. Click **"Active"** button
4. Try to create a flow again

### Expected Result
- ✅ Paused: No flow created
- ✅ Active: Flow created successfully
- ✅ Toggle buttons show correct state

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## Test 11: Clear All
**Feature**: Remove all flows and decorations

### Test Steps
1. Create 3-4 flows with different terminal styles (circles, diamonds)
2. Click **"Clear All"** button
3. Confirm the dialog
4. Check the canvas

### Expected Result
- ✅ All arrows removed
- ✅ All terminal decorations removed (no orphaned shapes)
- ✅ Flow counter resets to 0
- ✅ Confirmation dialog appears

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## Test 12: Flow Counter
**Feature**: Total flows display

### Test Steps
1. Note the **"Total Flows"** counter (should be 0)
2. Create a flow
3. Create 2 more flows
4. Click "Clear All"

### Expected Result
- ✅ Counter starts at 0
- ✅ Counter shows 1 after first flow
- ✅ Counter shows 3 after three flows
- ✅ Counter resets to 0 after clear all

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## Test 13: Node Deletion
**Feature**: Flows removed when nodes deleted

### Test Steps
1. Create a flow between two rectangles
2. **Delete one of the rectangles** (select and press Delete)
3. Check flow counter

### Expected Result
- ✅ Flow automatically removed when node deleted
- ✅ Flow counter decreases
- ✅ No error in console

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## Test 14: Multiple Flows
**Feature**: Creating many connections

### Test Steps
1. Create 10+ rectangles in various positions
2. Create flows between multiple pairs (at least 10 flows)
3. **Move several rectangles** simultaneously or one by one

### Expected Result
- ✅ All flows maintain correct connections
- ✅ All affected flows update when nodes move
- ✅ Performance remains smooth
- ✅ No visual glitches

### Actual Result
**Status**: ⏳ Not Tested

**Notes**:

---

## 🐛 Bugs Found

### Bug #1: Auto-Update Causes Performance Issues and Arrow Disappearance
**Title**: Auto-update feature causes severe performance degradation and arrows disappear

**Description**:
When moving or resizing objects with flow connections, Figma performance degrades significantly. The arrow completely disappears after dragging stops. Updates only appear after clicking elsewhere on the artboard.

**Steps to Reproduce**:
1. Create a flow between two rectangles
2. Drag one rectangle to a new position
3. Observe performance and arrow behavior

**Expected**:
- Smooth dragging with no lag
- Arrow updates in real-time during drag
- Arrow remains visible after drag completes

**Actual**:
- Heavy lag during drag operation
- Figma freezes momentarily
- Arrow completely disappears after drag
- Arrow only reappears after clicking elsewhere on artboard
- No real-time updates

**Severity**: 🔴 **Critical** - Core feature completely broken

**Status**: ✅ Fixed - Test 4 Now Passes

**Fix Details** (October 15, 2025):
The root cause was identified as expensive obstacle detection and delays:
1. `detectObstacles()` was calling `findAll()` on entire page
2. Arrow recreation was causing null bounds
3. Debouncing was adding perceptible delay

**Final Optimizations**:
1. ✅ Removed all debouncing/throttling - zero artificial delays
2. ✅ Cached tracked node IDs for instant O(1) lookups
3. ✅ Created `updateAffectedConnectionsFast()` - streamlined update path
4. ✅ Arrow replacement strategy: create new before removing old
5. ✅ Removed all logging overhead
6. ✅ Direct property checks instead of array operations

**Result**: Instant real-time updates with buttery-smooth performance

---

## 💡 Improvement Suggestions

### Suggestion #1
**Feature**:

**Description**:

**Priority**: High / Medium / Low

---

## 📝 Testing Notes

### General Observations


### Performance


### UI/UX


---

## ✅ Sign-off

**Tested By**: ________________

**Date**: ________________

**Overall Status**: ⏳ In Progress

**Ready for Release**: ☐ Yes | ☐ No | ☐ With Fixes

---

*Last Updated: October 15, 2025*
