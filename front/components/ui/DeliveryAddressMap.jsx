import { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { isGoogleMapsConfigured, loadGoogleMaps } from '../../lib/googleMaps';

/** Map preview centered on the saved delivery coordinates, never on the neighborhood centroid. */
export default function DeliveryAddressMap({ latitude, longitude, address }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [mapError, setMapError] = useState('');
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoordinates = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined
    && Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    if (!hasCoordinates || !isGoogleMapsConfigured || !mapElement.current) return undefined;
    let active = true;
    setMapError('');

    loadGoogleMaps().then(async (google) => {
      await google.maps.importLibrary('maps');
      if (!active || !mapElement.current) return;
      const position = { lat, lng };
      if (!mapInstance.current) {
        mapInstance.current = new google.maps.Map(mapElement.current, {
          center: position,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
      } else {
        mapInstance.current.setCenter(position);
        mapInstance.current.setZoom(17);
      }
      if (!markerInstance.current) {
        markerInstance.current = new google.maps.Marker({ map: mapInstance.current, position, title: address || 'Punto de entrega' });
      } else {
        markerInstance.current.setPosition(position);
        markerInstance.current.setTitle(address || 'Punto de entrega');
      }
    }).catch((error) => {
      if (active) setMapError(error.message || 'No se pudo mostrar el mapa.');
    });

    return () => { active = false; };
  }, [hasCoordinates, lat, lng, address]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="Mapa del punto de entrega">
      <div className="flex items-start gap-2 p-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-bold">Punto exacto de entrega</p>
          <p className="break-words text-xs text-slate-600">{address || 'Selecciona la dirección de entrega'}</p>
        </div>
        {hasCoordinates && <a className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-800 underline" href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noreferrer" aria-label="Abrir punto exacto en Google Maps"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Abrir</a>}
      </div>
      {hasCoordinates && isGoogleMapsConfigured ? <div ref={mapElement} className="h-56 w-full bg-slate-100" role="img" aria-label={`Mapa centrado en ${address || 'el punto exacto de entrega'}`} /> : (
        <div className="grid h-24 place-items-center bg-slate-50 px-4 text-center text-xs text-slate-600">
          {mapError || (hasCoordinates ? 'Configura VITE_GOOGLE_MAPS_API_KEY para ver el mapa.' : 'Guarda la dirección con Google Maps o usa tu ubicación para mostrar el punto exacto.')}
        </div>
      )}
      {mapError && <p role="status" className="px-3 pb-3 text-xs text-amber-800">{mapError}</p>}
    </section>
  );
}
