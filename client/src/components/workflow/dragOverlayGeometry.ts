// The DragOverlay's own geometry: its width, the Stub form re-anchor and the
// context-bounded clamp. Pure — no React, no dnd-kit runtime calls, only the
// shapes a dnd-kit Modifier's own args already carry.
//
// Coordinate spaces — every function below works in one of two:
//   | Function                  | Reads (space)                                    | Returns (space)      |
//   |----------------------------|---------------------------------------------------|-----------------------|
//   | overlayWidthFor            | region.rect (screen px)                          | width px, or null     |
//   | overlayShapeFor            | pop session, region rects (screen px), a Card's width px | form, width px or null |
//   | overlayClampRect          | rect (screen px), shape width px                 | rect (screen px)      |
//   | reanchorOverlayTransform   | transform (dnd-kit delta px), pickupRect/pointerNow (screen px) | transform (delta px) |
//   | clampToCurrentContext      | transform (delta px), rect/region rects (screen px) | transform (delta px) |
//   | clampAxis                  | translate (delta px), origin/size/min/max (screen px) | number (delta px)  |
// "Delta px" is dnd-kit's own transform space: a translation relative to
// the dragged node's initial position, never an absolute screen coordinate.

import type { Modifier } from '@dnd-kit/core';
import { CARD_CONTENT_INSET_PX, STUB_ROW_HEIGHT_PX } from '../cardMetrics';
import { isModalList, type DragRegion, type Point } from './dragRegions';
import type { PopSession } from './popSession';
import { overlayFormFor, placementRegion, type OverlayForm } from './placement';

export type OverlayTransform = Parameters<Modifier>[0]['transform'];
export type OverlayRect = Parameters<Modifier>[0]['draggingNodeRect'];

// How wide the carried Stub draws — a row's own width in the context Card's
// section, read off whichever region is currently locked. The hierarchy
// modal's region is its list, whose rect already *is* that width (a row spans
// the list's full box); on the board the region is the Card's own outer
// box, so a row's width is that minus the Card's own inset on both sides —
// the same number whether or not the section has rows (a childless Card has
// none).
export function overlayWidthFor(region: DragRegion | undefined): number | null {
  if (region?.kind !== 'descendants') return null;
  return isModalList(region) ? region.rect.width : region.rect.width - 2 * CARD_CONTENT_INSET_PX;
}

// Which form the carried copy draws as right now, and how wide: one
// derivation for the render (`BoardView.tsx`'s `DragOverlay`) and the
// re-anchor modifier, so they can't disagree.
//
// A null width leaves the copy at the width dnd-kit holds the DragOverlay to,
// the source row's at pickup. That is a Card's width for a Free Card's drag,
// so its shortCard needs none. A Stub's drag was picked up from a row, which
// is narrower than a Card in the Card's own section and far wider in the
// hierarchy modal, so its shortCard takes `stubDragCardWidthPx`, its
// containing Card's width: a copy drawn as a Card is as wide as one, and
// fits the card list that bounds it (wiki board-drag-interaction §2).
export interface OverlayShape {
  form: OverlayForm;
  widthPx: number | null;
}

export function overlayShapeFor(
  pop: PopSession | null,
  regions: readonly DragRegion[],
  stubDragCardWidthPx: number | null,
): OverlayShape {
  const region = placementRegion(pop, regions);
  const form = overlayFormFor(region);
  return { form, widthPx: form === 'stub' ? overlayWidthFor(region) : stubDragCardWidthPx };
}

// The carried copy's box for the clamp: dnd-kit's own measurement, at the
// width the copy is drawn at when the drag sets one. The measurement's left
// stays where the DragOverlay first mounted, while its width follows the
// copy a few frames late and, for a shortCard, is the tilted copy's bounding
// width, a few px over the width drawn. A Stub's drag mounts its copy
// untilted, so that left and that width describe two different boxes, and a
// copy as wide as its card list would be let that far out of it.
export function overlayClampRect(rect: OverlayRect, shape: OverlayShape): OverlayRect {
  if (!rect || shape.widthPx === null) return rect;
  return { ...rect, width: shape.widthPx, right: rect.left + shape.widthPx };
}

// Keeps the pointer on the carried copy when the copy is smaller than the
// row it was picked up as: across its form switch into a Stub, at the zoom
// into a Card's Descendants layer, and wherever a Stub's drag out of the
// hierarchy modal draws narrower than the modal's row. dnd-kit's own transform only ever
// tracks the *pickup* point (pure pointer delta since activation,
// independent of the dragged node's size: the overlay case never folds a
// node-rect delta into `transform`), so a box that shrinks after pickup
// leaves that same point glued to the pointer while the box's visible
// edges move out from under it — a card grabbed near its bottom edge ends
// up beside the pointer, not under it.
//
// Targets `widthPx` (the render side's own width, `overlayShapeFor`'s) and the
// fixed `STUB_ROW_HEIGHT_PX` rather than dnd-kit's live
// `draggingNodeRect`, which doesn't follow the form switch at once: the
// DragOverlay's ResizeObserver stays bound to the pickup form's content, and
// its top and left stay where the overlay was first measured.
// `pickupRect` is the carried copy's rect at pickup: where dnd-kit holds
// the overlay for the whole drag, whichever form it draws, with the
// transform the only thing that moves it. It has to be that rect and not the
// source row's live one (`activeNodeRect`): a Free Card that zooms into a
// section has its row swapped for the ghost's, which sits elsewhere, and a
// translate measured from there lands the copy that far from the pointer.
//
// Two things shrink the copy. The switch into a Stub from a shortCard
// (`intoStub`) changes both sizes, so both axes are re-targeted: x at the
// pickup's fraction across, y on the row's middle. A Stub's drag keeps a row's
// height or grows to a shortCard's, so only its width can shrink, and only
// when the row it picked up was the hierarchy modal's: its shortCard, and the
// Stub it becomes in a Card's own section, are both narrower. That re-targets
// x alone, the same way. Growing while keeping the same pickup offset can
// never push the pointer outside the (now bigger) box the way shrinking can,
// so a copy no smaller than at pickup, a Stub's drag in the layer it started
// in among them, keeps the natural, untouched transform.
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
  widthPx: number | null,
): OverlayTransform {
  if (!pickupRect || !pointerAtPickup || !pointerNow || widthPx == null) return transform;
  if (!('clientX' in pointerAtPickup) || !('clientY' in pointerAtPickup)) return transform;
  const intoStub = currentForm === 'stub' && pickupForm !== 'stub';
  if (!intoStub && !(pickupForm === 'stub' && widthPx < pickupRect.width)) return transform;
  const pickup = pointerAtPickup as PointerEvent;
  const pickupOffsetX = pickup.clientX - pickupRect.left;
  const fractionX = pickupRect.width > 0 ? pickupOffsetX / pickupRect.width : 0.5;
  const x = pointerNow.x - pickupRect.left - fractionX * widthPx;
  if (!intoStub) return { ...transform, x };
  return { ...transform, x, y: pointerNow.y - pickupRect.top - STUB_ROW_HEIGHT_PX / 2 };
}

// The overlay's translation clamped to the context's rect — sideways for a
// merged column, both axes for any other context; untouched with no context
// (wiki board-drag-interaction §2).
//
// Not the inverse of `popSession.ts::containmentRect`, which reads the
// region's `boundsRect` where it has one (a merged column's outer body, the
// hierarchy modal's dialog) and its `rect` otherwise: that decides whether the
// context still holds, this decides how far the carried copy follows the
// cursor, and clamps to the region's `rect` alone, with y left free for a
// merged column. The two answer against different boxes.
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
  // A sub-row bounds both axes; so does a Card's Descendants layer — a merged
  // column bounds x only.
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
