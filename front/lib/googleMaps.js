const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let mapsPromise;

export const isGoogleMapsConfigured = Boolean(API_KEY);

export function loadGoogleMaps() {
  if (!API_KEY) return Promise.reject(new Error('Google Maps no está configurado.'));
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google);
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    window.gm_authFailure = () => window.dispatchEvent(new CustomEvent('domiflow-google-maps-auth-failure'));
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&loading=async&language=es&region=CO&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => window.google?.maps?.importLibrary
      ? resolve(window.google)
      : reject(new Error('Google Maps no quedó disponible. Habilita Maps JavaScript API y Places API (New) en el mismo proyecto de Google Cloud.'));
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error('No fue posible cargar Google Maps. Verifica la clave, la facturación y la restricción HTTP para localhost:5173.'));
    };
    document.head.appendChild(script);
  });
  return mapsPromise.catch((error) => { mapsPromise = null; throw error; });
}
