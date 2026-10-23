# Bugfix Specification: Passive Event Listener Warning

## Introduction

This bugfix addresses a passive event listener warning that appears in the browser console when visiting the recommendation page. While the zoom functionality works correctly, the warning pollutes the development console and indicates non-optimal event handling that could impact scroll performance on slower devices.

The bug occurs because React's synthetic event system cannot specify the `{passive: false}` option required by modern browsers when calling `preventDefault()` on wheel events.

## Bug Analysis

### Bug Description

**Observable Behavior:**
Browser console shows a passive event listener warning immediately upon visiting the recommendation page:
```
[Violation] Added non-passive event listener to a scroll-blocking 'wheel' event.
```

**Trigger Conditions:**
- **When**: Warning appears immediately when the page loads
- **Where**: Recommendation page with canvas-based floor plan preview
- **Component**: React `onWheel` handler on the `.svg-container` div in `App.jsx` (line 559)
- **Action**: Any mouse wheel interaction over the canvas triggers the warning

**Impact:**
- **Severity**: Low (functionality works but console shows warning)
- **User Experience**: No visible impact, but pollutes console during development
- **Performance**: Minor - scroll-blocking events can cause jank on slow devices

### Bug Condition

The bug occurs when using React's synthetic `onWheel` event handler for zoom control.

**Bug Condition (C)**: `isBugCondition(input)`
```
isBugCondition(input) :=
  input.eventHandlerType = "React synthetic event" AND
  input.eventName = "onWheel" AND
  input.preventDefault() is called
```

**Concrete failing case**: 
- Using `<div onWheel={handleCanvasWheel}>` in React JSX
- Handler calls `e.preventDefault()` to block scrolling
- Browser warns about non-passive listener on every wheel event

### Current Behavior (Defect)

When the recommendation page loads and user scrolls over the canvas:

1. Browser console displays: `[Violation] Added non-passive event listener to a scroll-blocking 'wheel' event.`
2. Warning appears immediately on page load
3. Zoom functionality works correctly but triggers the warning on every wheel event
4. React's synthetic event system cannot specify `{passive: false}` option
5. Modern browsers default wheel events to passive for better scroll performance
6. Calling `preventDefault()` in a passive listener triggers the warning

**Root Cause:**
React's `onWheel` handler cannot pass the `{passive: false}` option to the underlying DOM event listener. When `e.preventDefault()` is called inside the handler, Chrome detects a scroll-blocking operation on what it assumed would be a passive listener.

### Expected Behavior (Correct)

For all inputs where `isBugCondition(input)` is true (wheel events on the canvas), the fixed code must satisfy:

**Property 1**: No passive event listener warnings
```
expectedBehavior(result) :=
  result.consoleWarnings.filter(w => w.includes("passive event listener")) = []
```

**Property 2**: Zoom functionality preserved
```
expectedBehavior(result) :=
  result.zoomOnWheel = true AND
  result.preventDefaultScroll = true
```

**Property 3**: Event listener properly configured
```
expectedBehavior(result) :=
  result.listenerOptions.passive = false AND
  result.listenerAttached = "native DOM"
```

### Unchanged Behavior (Regression Prevention)

For all inputs where `¬isBugCondition(input)` (non-wheel events), behavior must be preserved:

**Preservation 1**: Other mouse events unchanged
```
preserve(input) where input.eventName ∈ {"mouseDown", "mouseMove", "mouseUp", "mouseLeave"} :=
  F(input) = F'(input)
```

**Preservation 2**: Pan functionality unchanged
```
preserve(input) where input.action = "pan" AND input.method = "mouseDrag" :=
  F(input).panBehavior = F'(input).panBehavior
```

**Preservation 3**: Zoom button controls unchanged
```
preserve(input) where input.action ∈ {"zoomIn", "zoomOut", "resetZoom"} AND input.method = "button" :=
  F(input).zoomButtons = F'(input).zoomButtons
```

**Preservation 4**: Canvas rendering unchanged
```
preserve(input) where input.action = "render" :=
  F(input).canvasOutput = F'(input).canvasOutput
```

## Proposed Fix

Replace React's `onWheel` handler with a native DOM event listener that explicitly sets `{passive: false}`:

```javascript
// Add useRef for container
const svgContainerRef = useRef(null);

// Add useEffect to attach native listener
useEffect(() => {
  const container = svgContainerRef.current;
  if (!container) return;
  
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta * 0.5));
    setZoom(newZoom);
  };
  
  container.addEventListener('wheel', handleWheel, { passive: false });
  return () => container.removeEventListener('wheel', handleWheel);
}, [zoom]);

// Update JSX - remove onWheel, add ref
<div
  ref={svgContainerRef}
  className="svg-container"
  onMouseDown={handleCanvasMouseDown}
  onMouseMove={handleCanvasMouseMove}
  onMouseUp={handleCanvasMouseUp}
  onMouseLeave={handleCanvasMouseUp}
  style={{ touchAction: 'none', background: '#f5f5f5' }}
>
```

## Testing Strategy

### Bug Condition Test (before fix)
1. Start the recommendation system
2. Upload a floor plan and navigate to recommendations page
3. Open browser console (F12)
4. Scroll mouse wheel over the canvas
5. **Expected**: Warning appears in console
6. **Confirms**: Bug exists

### Preservation Tests (before fix)
1. Test mouse wheel zoom functionality - should zoom in/out
2. Test pan with mouse drag - should pan canvas
3. Test zoom in/out/reset buttons - should adjust zoom
4. Test canvas rendering - floor plan and overlays display correctly
5. **Expected**: All work correctly
6. **Confirms**: Baseline behavior to preserve

### Verification (after fix)
1. Load the recommendation page
2. Open browser console (F12)
3. Clear console
4. Scroll mouse wheel over canvas multiple times
5. **Expected**: No passive event listener warning
6. Verify zoom with wheel still works smoothly
7. Verify pan and zoom buttons still work
8. Verify canvas rendering unchanged
9. **Confirms**: Bug fixed, behavior preserved

## Files to Modify

- `Recommendation/frontend/src/App.jsx`
  - Add `svgContainerRef` using `useRef(null)`
  - Add `useEffect` hook with native wheel event listener
  - Remove `onWheel={handleCanvasWheel}` from JSX
  - Add `ref={svgContainerRef}` to `.svg-container` div
  - Update `handleCanvasWheel` logic inline in useEffect

## Risk Assessment

- **Risk Level**: Low
- **Rationale**: Isolated change to event handling mechanism; zoom logic remains the same
- **Rollback Plan**: Revert to React synthetic event if issues arise
- **Dependencies**: None - self-contained change to one component
- **Testing**: Simple manual testing in browser console confirms fix
