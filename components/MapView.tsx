'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PLOTS } from '@/lib/data';

export default function MapView() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-6.12, 106.15],
      zoom: 16,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
    }).addTo(map);

    PLOTS.forEach((p) => {
      const poly = L.polygon(p.coords, {
        color: p.color,
        weight: 2,
        fillColor: p.color,
        fillOpacity: 0.45,
      }).addTo(map);

      const icon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background:${p.color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:#fff;border-radius:50%"></div></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      L.marker(poly.getBounds().getCenter(), { icon, title: `Penggarap ${p.name}` })
        .addTo(map)
        .bindPopup(`<strong>Penggarap: ${p.name}</strong><br><small>Komoditas: Padi Sawah</small>`);
    });

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}