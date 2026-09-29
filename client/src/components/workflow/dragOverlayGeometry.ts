// The DragOverlay's own geometry: its width, the Stub form re-anchor and the
// context-bounded clamp. Pure — no React, no dnd-kit runtime calls, only the
// shapes a dnd-kit Modifier's own args already carry.
//
// Coordinate spaces — every function below works in one of two:
//   | Function                  | Reads (space)                                    | Returns (space)      |
//   |----------------------------|---------------------------------------------------|-----------------------|
//   | overlayWidthFor            | region.rect (screen px)                          | width px, or null     |
//   | reanchorOverlayTransform   | transform (dnd-kit delta px), pickupRect/pointerNow (screen px) | transform (delta px) |
//   | clampToCurrentContext      | transform (delta px), rect/region rects (screen px) | transform (delta px) |
//   | clampAxis                  | translate (delta px), origin/size/min/max (screen px) | number (delta px)  |
// "Delta px" is dnd-kit's own transform space: a translation relative to
// the dragged node's initial position, never an absolute screen coordinate.

import type { Modifier } from '@dnd-kit/core';
import { CARD_CONTENT_INSET_PX, CARRIED_STUB_HEIGHT_PX } from '../cardMetrics';
import type { DragRegion, Point } from './dragRegions';
import type { PopSession } from './popSession';
import { overlayFormFor, placementRegion, type OverlayForm } from './placement';

export type OverlayTransform = Parameters<Modifier>[0]['transform'];
export type OverlayRect = Parameters<Modifier>[0]['draggingNodeRect'];

// How wide the carried Stub draws — a row's own width in the context Card's
// section, read off whichever region is currently locked. A `descendants`
// region's rect already *is* that width (a row spans its section's full
// box); a `card` region's rect is the Card's own outer bound, so a row's
// width is that minus the Card's own inset on both sides — the same number
// whether or not the section itself has resolved (a childless Card has
// none).
export function overlayWidthFor(region: DragRegion | undefined): number | null {
  if (!region) return null;
  if (region.kind === 'descendants') return region.rect.width;
  if (region.kind === 'card') return region.rect.width - 2 * CARD_CONTENT_INSET_PX;
  return null;
}

// Which form the carried copy draws as right now, and how wide: one
// derivation for the render (`BoardView.tsx`'s `DragOverlay`) and the
// re-anchor modifier, so they can't disagree. A width only for the Stub form.
export interface OverlayShape {
  form: OverlayForm;
  widthPx: number | null;
}

export function overlayShapeFor(pop: PopSession | null, regions: readonly DragRegion[]): OverlayShape {
  const region = placementRegion(pop, regions);
  const form = overlayFormFor(region);
  return { form, widthPx: form === 'stub' ? overlayWidthFor(region) : null };
}

// Keeps the pointer on the carried copy across its own form switch into a
// Stub, at the Card-layer boundary. dnd-kit's own transform only ever
// tracks the *pickup* point (pure pointer delta since activation,
// independent of the dragged node's size: the overlay case never folds a
// node-rect delta into `transform`), so a box that shrinks after pickup
// leaves that same point glued to the pointer while the box's visible
// edges move out from under it — a card grabbed near its bottom edge ends
// up beside the pointer, not under it.
//
// Targets `stubWidthPx` (the render side's own `overlayWidthFor`) and the
// fixed `CARRIED_STUB_HEIGHT_PX` rather than dnd-kit's live
// `draggingNodeRect`, which doesn't follow the form switch: the
// DragOverlay's ResizeObserver stays bound to the pickup form's content.
// `pickupRect` (`activeNodeRect`, the *source* row, never swapped out
// mid-drag) stands in for "the overlay's own resting position": this
// expects the overlay to stay positioned at the pickup rect for the whole
// drag, whichever form it draws.
//
// Never compensates back *out* of Stub form (`currentForm !== 'stub'`):
// growing larger while keeping the same pickup offset can never push the
// pointer outside the (now bigger) box the way shrinking can, so the
// natural, untouched transform already keeps the pointer on the copy.
// Nor while *already* in Stub form at pickup (`pickupForm === 'stub'`, a
// Stub's own drag) — nothing shrunk out from under anything, the natural
// offset is already right.
//
// Deliberately computes an absolute x/y from `pointerNow` instead of an
// offset relative to the incoming `transform`: this same modifier array
// runs *twice* per frame (once inside `DndContext`'s own transform
// tracking, again inside `DragOverlay`'s render, chained, the second
// call's input being the first call's output), and `clampAxis` is safe to
// re-apply because clamping an in-range value is a true no-op — an
// *additive* compensation isn't, and would double itself on the second
// call. Reading `pointerNow` (the hook's own tracked pointer, independent
// of dnd-kit's modifier pipeline) instead of deriving "where the pointer
// is" from `transform` sidesteps that: both chained calls read the same
// live pointer and the same fixed target, so both compute the identical
// absolute answer.
export function reanchorOverlayTransform(
  transform: OverlayTransform,
  pickupRect: OverlayRect,
  pointerAtPickup: Event | null,
  pointerNow: Point | null,
  pickupForm: OverlayForm,
  currentForm: OverlayForm,
  stubWidthPx: number | null,
): OverlayTransform {
  if (currentForm !== 'stub' || pickupForm === 'stub') return transform;
  if (!pickupRect || !pointerAtPickup || !pointerNow || stubWidthPx == null) return transform;
  if (!('clientX' in pointerAtPickup) || !('clientY' in pointerAtPickup)) return transform;
  const pickup = pointerAtPickup as PointerEvent;
  const pickupOffsetX = pickup.clientX - pickupRect.left;
  const fractionX = pickupRect.width > 0 ? pickupOffsetX / pickupRect.width : 0.5;
  return {
    ...transform,
    x: pointerNow.x - pickupRect.left - fractionX * stubWidthPx,
    y: pointerNow.y - pickupRect.top - CARRIED_STUB_HEIGHT_PX / 2,
  };
}

// The overlay's translation clamped to the context's rect — sideways for a
// merged column, both axes for any other context; untouched with no context
// (wiki board-drag-interaction §2).
//
// Not the inverse of `popSession.ts::containmentRect`'s `=== 'column'`:
// that decides whether the context still holds, this decides how far the
// carried copy follows the cursor, and a merged column answers the two
// against different boxes.
export function clampToCurrentContext(
  transform: OverlayTransform,
  rect: OverlayRect,
  pop: PopSession | null,
  regions: readonly DragRegion[],
): OverlayTransform {
  if (!pop || !rect) return transform;
  const context = regions.find(r => r.key === pop.contextKey);
  if (!context) return transform;
  const x = clampAxis(transform.x, rect.left, rect.width, context.rect.left, context.rect.right);
  // A sub-row bounds both axes; so do a Card and its Descendants section —
  // a merged column bounds x only.
  const y =
    context.kind !== 'column'
      ? clampAxis(transform.y, rect.top, rect.height, context.rect.top, context.rect.bottom)
      : transform.y;
  return { ...transform, x, y };
}

// Keeps `origin + size` inside `[min, max]` by adjusting the translation.
export function clampAxis(translate: number, origin: number, size: number, min: number, max: number): number {
  const low = min - origin;
  const high = max - size - origin;
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);
  return Math.min(hi, Math.max(lo, translate));
}
