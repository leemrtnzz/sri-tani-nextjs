/* eslint-disable @typescript-eslint/no-explicit-any -- Modul leaflet pada proyek ini belum bertipe. */
'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { formatHa } from '@/lib/format';
import {
  DEFAULT_MAP_CENTER,
  polygonAreaHa,
  type Coordinate,
} from '@/lib/geo';
import type { PetakRow } from '@/lib/types';

type MapEditorProps = {
  value: Coordinate[];
  color?: string;
  existingPlots?: PetakRow[];
  onChange: (coords: Coordinate[], areaHa: number) => void;
  heightClass?: string;
};

function safeColor(color?: string): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#16a34a';
}

export default function MapEditor({
  value,
  color = '#16a34a',
  existingPlots = [],
  onChange,
  heightClass = 'h-[360px]',
}: MapEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const coordsRef = useRef<Coordinate[]>([...value]);
  const emitRef = useRef<() => void>(() => {});
  const onChangeRef = useRef(onChange);
  const [area, setArea] = useState(() => polygonAreaHa(value));
  const [points, setPoints] = useState(value.length);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: value.length > 0 ? value[0] : DEFAULT_MAP_CENTER,
      zoom: 16,
      doubleClickZoom: false,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri' },
    ).addTo(map);

    const contextLayer = L.layerGroup().addTo(map);
    existingPlots.forEach((plot) => {
      if (!Array.isArray(plot.coords) || plot.coords.length < 3) return;
      const plotColor = safeColor(plot.color);
      L.polygon(plot.coords, {
        color: plotColor,
        weight: 1,
        fillColor: plotColor,
        fillOpacity: 0.12,
        opacity: 0.45,
      })
        .addTo(contextLayer)
        .bindTooltip(`${plot.nama} (${plot.penggarapNama})`, { sticky: true });
    });

    const polygonLayer = L.layerGroup().addTo(map);
    const vertexLayer = L.layerGroup().addTo(map);
    const draftColor = safeColor(color);

    const redraw = () => {
      polygonLayer.clearLayers();
      vertexLayer.clearLayers();

      const coords = coordsRef.current;
      if (coords.length >= 2) {
        L.polyline(coords, {
          color: draftColor,
          weight: 2,
          dashArray: '6 4',
          opacity: 0.95,
        }).addTo(polygonLayer);
      }

      if (coords.length >= 3) {
        L.polygon(coords, {
          color: draftColor,
          weight: 2,
          fillColor: draftColor,
          fillOpacity: 0.28,
        }).addTo(polygonLayer);
      }

      coords.forEach((point, index) => {
        const marker = L.marker(point, {
          icon: L.divIcon({
            className: 'plot-vertex',
            html: `<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid ${draftColor};box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          }),
          title: `Titik ${index + 1}`,
        });
        marker.addTo(vertexLayer);
      });
    };

    const emit = () => {
      const nextArea = polygonAreaHa(coordsRef.current);
      setArea(nextArea);
      setPoints(coordsRef.current.length);
      redraw();
      onChangeRef.current([...coordsRef.current], nextArea);
    };

    emitRef.current = emit;

    map.on('click', (event: any) => {
      coordsRef.current = [
        ...coordsRef.current,
        [
          Number(event.latlng.lat.toFixed(6)),
          Number(event.latlng.lng.toFixed(6)),
        ],
      ];
      emit();
    });

    redraw();

    if (coordsRef.current.length >= 2) {
      map.fitBounds(L.latLngBounds(coordsRef.current).pad(0.2), { maxZoom: 18 });
    } else if (existingPlots.length > 0) {
      const all = existingPlots.flatMap((plot) => plot.coords);
      if (all.length > 0) {
        map.fitBounds(L.latLngBounds(all).pad(0.1), { maxZoom: 17 });
      }
    }

    const invalidate = () => map.invalidateSize();
    const timer = window.setTimeout(invalidate, 180);
    window.addEventListener('resize', invalidate);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', invalidate);
      map.remove();
      mapRef.current = null;
    };
    // Editor dibuat ulang setiap dialog dibuka, nilai awal cukup dibaca sekali.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const undo = () => {
    if (coordsRef.current.length === 0) return;
    coordsRef.current = coordsRef.current.slice(0, -1);
    emitRef.current();
  };

  const clear = () => {
    if (coordsRef.current.length === 0) return;
    coordsRef.current = [];
    emitRef.current();
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative ${heightClass} w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-100`}
      >
        <div ref={containerRef} className="h-full w-full" />

        <div className="absolute top-2.5 right-2.5 z-[800] w-[150px] rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md">
          <div className="text-[11px] font-medium text-slate-600">Luas terhitung</div>
          <div className="text-lg font-bold text-slate-900">{formatHa(area)}</div>
          <div className="mt-1 text-[11px] text-slate-600">{points} titik batas</div>
          <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-600">
            {points < 3
              ? 'Tambahkan minimal 3 titik pada peta.'
              : 'Batas lahan siap disimpan.'}
          </div>
        </div>

        <div className="absolute bottom-2.5 left-2.5 z-[800] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={points === 0}
            className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <i className="bi bi-arrow-counterclockwise mr-1" />
            Hapus titik terakhir
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={points === 0}
            className="min-h-9 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
          >
            <i className="bi bi-eraser mr-1" />
            Hapus semua
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-600">
        Klik pada peta untuk menambahkan titik batas lahan. Luas dihitung otomatis
        dari poligon yang Anda gambar.
      </p>
    </div>
  );
}
