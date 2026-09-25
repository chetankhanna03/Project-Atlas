import React, { useEffect, useRef, useState } from "react";
import { DomEvent } from "leaflet";
import { Rectangle, Tooltip, useMap } from "react-leaflet";

export type Area = { west: number; south: number; east: number; north: number };
export const validArea = (a: Area) =>
  Object.values(a).every(Number.isFinite) &&
  a.west >= -180 &&
  a.east <= 180 &&
  a.south >= -90 &&
  a.north <= 90 &&
  a.west < a.east &&
  a.south < a.north;

export function rectangleArea(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): Area | null {
  const offset = Math.floor(((a.lng + b.lng) / 2 + 180) / 360) * 360;
  const round = (n: number) => +n.toFixed(5);
  const area = {
    west: round(Math.min(a.lng, b.lng) - offset),
    east: round(Math.max(a.lng, b.lng) - offset),
    south: round(Math.min(a.lat, b.lat)),
    north: round(Math.max(a.lat, b.lat)),
  };
  return validArea(area) ? area : null;
}

export function MapAreaSelection({
  area,
  focus,
  drawing,
  setDrawing,
  onSelect,
  onClear,
}: {
  area: Area | null;
  focus: Area;
  drawing: boolean;
  setDrawing: (value: boolean) => void;
  onSelect: (area: Area, method: string) => void;
  onClear: () => void;
}) {
  const map = useMap();
  const [preview, setPreview] = useState<Area | null>(null);
  const [message, setMessage] = useState("");
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ pan: false }),
    );
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    const element = toolbar.current;
    if (!element) return;
    DomEvent.disableClickPropagation(element);
    DomEvent.disableScrollPropagation(element);
    return () => {
      DomEvent.off(element);
    };
  }, []);
  useEffect(() => {
    if (validArea(focus))
      map.fitBounds(
        [
          [focus.south, focus.west],
          [focus.north, focus.east],
        ],
        { padding: [35, 35], animate: false },
      );
  }, [focus, map]);
  useEffect(() => {
    if (!drawing) {
      setPreview(null);
      start.current = null;
      return;
    }
    setMessage("");
    surface.current?.focus({ preventScroll: true });
    const handlers = [
      map.dragging,
      map.touchZoom,
      map.doubleClickZoom,
      map.scrollWheelZoom,
      map.boxZoom,
      map.keyboard,
    ];
    const active = handlers.filter((handler) => handler.enabled());
    active.forEach((handler) => handler.disable());
    const cancel = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawing(false);
    };
    window.addEventListener("keydown", cancel);
    return () => {
      active.forEach((handler) => handler.enable());
      window.removeEventListener("keydown", cancel);
    };
  }, [drawing, map, setDrawing]);
  const point = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = map.getContainer().getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
      y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)),
    };
  };
  const toArea = (p: { x: number; y: number }) =>
    start.current &&
    rectangleArea(
      map.containerPointToLatLng([start.current.x, start.current.y]),
      map.containerPointToLatLng([p.x, p.y]),
    );
  const selected = preview || area;
  return (
    <>
      {selected && validArea(selected) && (
        <Rectangle
          bounds={[
            [selected.south, selected.west],
            [selected.north, selected.east],
          ]}
          interactive={false}
          pathOptions={{
            color: "#0891b2",
            weight: 3,
            fillOpacity: 0.14,
            dashArray: drawing ? "6 4" : undefined,
          }}
        >
          <Tooltip permanent direction="center" opacity={1}>
            {preview ? "Selecting area…" : "Selected area"}
          </Tooltip>
        </Rectangle>
      )}
      {drawing && (
        <div
          ref={surface}
          tabIndex={-1}
          aria-label="Area drawing surface"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 800,
            touchAction: "none",
            cursor: "crosshair",
            outline: "3px solid #0891b2",
            outlineOffset: -3,
          }}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            const p = point(event);
            start.current = { ...p, id: event.pointerId };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (start.current?.id !== event.pointerId) return;
            event.preventDefault();
            setPreview(toArea(point(event)));
          }}
          onPointerUp={(event) => {
            if (start.current?.id !== event.pointerId) return;
            event.preventDefault();
            event.stopPropagation();
            const p = point(event),
              origin = start.current,
              next = toArea(p);
            start.current = null;
            setPreview(null);
            if (Math.abs(p.x - origin.x) < 5 || Math.abs(p.y - origin.y) < 5) {
              setMessage(
                "Drag a larger rectangle; a click does not select an area.",
              );
              return;
            }
            if (!next) {
              setMessage(
                "Select an area within one world map. Split areas crossing the date line.",
              );
              return;
            }
            onSelect(next, "Drawn area");
            setDrawing(false);
          }}
          onPointerCancel={() => {
            start.current = null;
            setPreview(null);
            setDrawing(false);
          }}
          onLostPointerCapture={() => {
            start.current = null;
            setPreview(null);
          }}
        />
      )}
      <div
        ref={toolbar}
        className="absolute top-3 right-3 left-14 flex flex-wrap justify-end gap-2"
        style={{ zIndex: 1000 }}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-pressed={drawing}
          onClick={() => setDrawing(!drawing)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold shadow transition-colors focus-visible:ring-2 focus-visible:ring-cyan-600 ${drawing ? "bg-cyan-800 text-white" : "bg-white text-cyan-900 hover:bg-cyan-50"}`}
        >
          {drawing ? "Cancel drawing" : "Draw Area"}
        </button>
        <button
          type="button"
          disabled={drawing}
          className="rounded-lg border bg-white px-3 py-2 text-sm shadow hover:bg-cyan-50 disabled:opacity-50"
          onClick={() => {
            const bounds = map.getBounds();
            const next = rectangleArea(
              bounds.getSouthWest(),
              bounds.getNorthEast(),
            );
            if (next) {
              onSelect(next, "Visible map area");
              setMessage("");
            } else
              setMessage(
                "Zoom in to select bounds within one world map; split areas crossing the date line.",
              );
          }}
        >
          Use visible map area
        </button>
        <button
          type="button"
          onClick={() => {
            setDrawing(false);
            setMessage("");
            onClear();
          }}
          className="rounded-lg border bg-white px-3 py-2 text-sm shadow hover:bg-slate-100"
        >
          Clear Selection
        </button>
      </div>
      <div
        role="status"
        className="absolute bottom-6 left-3 right-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-800 shadow pointer-events-none"
        style={{ zIndex: 1000 }}
      >
        {message ||
          (drawing
            ? "Click or touch and drag a rectangle. Release to select. Escape or Cancel to stop."
            : area
              ? "Selected area — coordinates updated. Click Load data to retrieve observations."
              : "Pan and zoom, or choose Draw Area to select a rectangle.")}
      </div>
    </>
  );
}
