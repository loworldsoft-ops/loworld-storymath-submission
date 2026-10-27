import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { spreadOverlappingCertMapMarkers } from '../../../../services/utils/curriculum-map-markers';
import { type HwMapRenderer, type HwMapInitOptions } from '../../../../services/tokens/map-renderer.token';
import { type CertMapMarker } from '../../../../services/models/curriculum.model';

/**
 * Showcase 전용 Leaflet 기반 HwMapRenderer 구현체.
 * loworld-study/LeafletMapRendererService와 동일 로직 — showcase 앱 번들 분리를 위해 별도 파일.
 */
@Injectable()
export class LeafletMapRendererService implements HwMapRenderer {
  private map!: L.Map;
  private layerGroup!: L.LayerGroup;
  private circleMarkers = new Map<string, L.CircleMarker>();

  init(container: HTMLElement, options: HwMapInitOptions = {}): void {
    const { center = [25, 105] as [number, number], zoom = 3, minZoom = 2, maxZoom = 10 } = options;

    this.map = L.map(container, { center, zoom, minZoom, maxZoom, zoomControl: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    this.layerGroup = L.layerGroup().addTo(this.map);

    setTimeout(() => this.map.invalidateSize(), 0);
  }

  setMarkers(markers: CertMapMarker[], onSelect: (m: CertMapMarker) => void): void {
    this.layerGroup.clearLayers();
    this.circleMarkers.clear();

    const placed = spreadOverlappingCertMapMarkers(markers);

    for (const m of placed) {
      const circle = L.circleMarker([m.lat, m.lng], {
        radius: 10,
        fillColor: '#7c3aed',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      });

      circle.bindTooltip(
        `<strong>${m.menteeName}</strong><br>${m.countryNameKo}${m.city ? ' · ' + m.city : ''}`,
        { permanent: false, direction: 'top' },
      );

      circle.on('click', () => {
        const original = markers.find(x => x.certificationId === m.certificationId) ?? m;
        onSelect(original);
        circle.setStyle({ fillColor: '#db2777', radius: 13 });
        this.circleMarkers.forEach((c, id) => {
          if (id !== original.certificationId) c.setStyle({ fillColor: '#7c3aed', radius: 10 });
        });
      });

      circle.addTo(this.layerGroup);
      this.circleMarkers.set(m.certificationId, circle);
    }

    if (placed.length > 0) {
      const bounds = L.latLngBounds(placed.map(p => [p.lat, p.lng] as L.LatLngTuple));
      this.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12, animate: false });
    }
  }

  flyTo(lat: number, lng: number, zoom = 5): void {
    this.map?.flyTo([lat, lng], zoom, { duration: 1 });
  }

  destroy(): void {
    this.map?.remove();
  }
}
