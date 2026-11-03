/* eslint-disable @typescript-eslint/no-explicit-any -- Modul leaflet pada proyek ini belum bertipe. */
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { formatHa, label } from '@/lib/format';
import { DEFAULT_MAP_CENTER, type Coordinate } from '@/lib/geo';

export interface PlotData {
  id?: number;
  name: string;
  penggarapName?: string;
  color: string;
  coords: Coordinate[];
  luasHa?: number | string | null;
  status?: string;
  fase?: string;
}

function safeColor(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#16a34a';
}

function popupElement(plot: PlotData): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'text-xs leading-relaxed';
  wrapper.style.minWidth = '170px';

  const title = document.createElement('div');
  title.className = 'font-bold text-slate-900 text-sm';
  title.textContent = plot.name;
  wrapper.appendChild(title);

  const owner = document.createElement('div');
  owner.className = 'text-slate-700 mt-0.5';
  owner.textContent = `Penggarap: ${plot.penggarapName ?? plot.name}`;
  wrapper.appendChild(owner);

  const area = document.createElement('div');
  area.className = 'text-slate-700';
  area.textContent = `Luas: ${formatHa(plot.luasHa ?? 0)}`;
  wrapper.appendChild(area);

  const plant = document.createElement('div');
  plant.className = 'text-slate-700';
  plant.textContent = `Status tanam: ${label(plot.fase ?? plot.status)}`;
  wrapper.appendChild(plant);

  return wrapper;
}

export default function MapView({ plots = [] }: { plots?: PlotData[] }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: 15,
      scrollWheelZoom: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles &copy; Esri' },
    ).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);

    const invalidate = () => map.invalidateSize();
    const timer = window.setTimeout(invalidate, 150);
    window.addEventListener('resize', invalidate);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', invalidate);
      map.remove();
      mapInstanceRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    let bounds: any = null;

    plots.forEach((plot) => {
      if (!Array.isArray(plot.coords) || plot.coords.length < 3) return;
      const color = safeColor(plot.color);

      const polygon = L.polygon(plot.coords, {
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.42,
      }).addTo(layer);

      polygon.bindPopup(popupElement(plot));

      const icon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background:${color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:#fff;border-radius:50%"></div></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      L.marker(polygon.getBounds().getCenter(), {
        icon,
        title: plot.penggarapName ?? plot.name,
      })
        .addTo(layer)
        .bindPopup(popupElement(plot));

      const polygonBounds = polygon.getBounds();
      bounds = bounds ? bounds.extend(polygonBounds) : polygonBounds;
    });

    if (bounds) {
      map.fitBounds(bounds.pad(0.12), { maxZoom: 17 });
    } else {
      map.setView(DEFAULT_MAP_CENTER, 15);
    }

    window.setTimeout(() => map.invalidateSize(), 60);
  }, [plots]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
