'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapProps } from '@/shared/types/map';

// Suppress WebGL warnings globally
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: unknown[]) => {
    const message = String(args[0] ?? '');
    if (message.includes('WebGL') || message.includes('GroupMarkerNotSet') || message.includes('swiftshader')) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: unknown[]) => {
    const message = String(args[0] ?? '');
    if (message.includes('WebGL') || message.includes('GroupMarkerNotSet') || message.includes('swiftshader')) {
      return;
    }
    originalError.apply(console, args);
  };
}

const mapDebugEnabled = process.env.NEXT_PUBLIC_MAP_DEBUG === 'true';

/** Échappe les caractères HTML pour éviter les injections XSS dans les popups MapLibre */
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

type BoundsSnapshot = {
  south: number;
  west: number;
  north: number;
  east: number;
};

type POIMarkerData = {
  element: OverpassElement;
  coords: {
    lat: number;
    lon: number;
  };
};

const captureBounds = (bounds: maplibregl.LngLatBounds): BoundsSnapshot => ({
  south: bounds.getSouth(),
  west: bounds.getWest(),
  north: bounds.getNorth(),
  east: bounds.getEast(),
});

const boundsDistance = (bounds1: BoundsSnapshot, bounds2: BoundsSnapshot): number => {
  const latDiff = Math.abs(bounds1.south - bounds2.south);
  const lngDiff = Math.abs(bounds1.west - bounds2.west);
  return Math.sqrt(latDiff ** 2 + lngDiff ** 2);
};

const deriveCoordinates = (element: OverpassElement): { lat: number; lon: number } | null => {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { lat: element.lat, lon: element.lon };
  }

  if (element.center) {
    return { lat: element.center.lat, lon: element.center.lon };
  }

  if (element.bounds) {
    const { minlat, maxlat, minlon, maxlon } = element.bounds;
    return {
      lat: (minlat + maxlat) / 2,
      lon: (minlon + maxlon) / 2,
    };
  }

  if (element.geometry && element.geometry.length > 0) {
    const total = element.geometry.reduce(
      (acc, point) => {
        acc.lat += point.lat;
        acc.lon += point.lon;
        return acc;
      },
      { lat: 0, lon: 0 }
    );
    return {
      lat: total.lat / element.geometry.length,
      lon: total.lon / element.geometry.length,
    };
  }

  return null;
};

const createPoiKey = (item: POIMarkerData): string => {
  const { coords, element } = item;
  return `${coords.lat.toFixed(5)}|${coords.lon.toFixed(5)}|${element.tags?.amenity ?? ''}|${element.tags?.leisure ?? ''}|${element.tags?.shop ?? ''}`;
};

const formatAddress = (tags?: OverpassElement['tags']): string | null => {
  if (!tags) {
    return null;
  }

  const streetParts = [
    tags['addr:housenumber'] ?? null,
    tags['addr:street'] ?? null,
  ].filter(Boolean);

  const cityParts = [
    tags['addr:postcode'] ?? null,
    tags['addr:city'] ?? null,
  ].filter(Boolean);

  const addressSegments = [
    streetParts.join(' ').trim(),
    cityParts.join(' ').trim(),
  ].filter(segment => segment.length > 0);

  if (addressSegments.length === 0 && tags.name) {
    return tags.name;
  }

  return addressSegments.length > 0 ? addressSegments.join(', ') : null;
};

const buildGoogleMapsUrl = (element: OverpassElement, coords: { lat: number; lon: number }, address: string | null): string => {
    const destination = address
        ? address
        : element.tags?.name
          ? `${element.tags.name}, ${coords.lat}, ${coords.lon}`
          : `${coords.lat}, ${coords.lon}`;

    const encodedDestination = encodeURIComponent(destination);
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`;
};

const toMarkerData = (elements: OverpassElement[]): POIMarkerData[] => {
  const unique = new globalThis.Map<string, POIMarkerData>();

  elements.forEach((element) => {
    const coords = deriveCoordinates(element);
    if (!coords) return;

    const item: POIMarkerData = { element, coords };
    const key = createPoiKey(item);

    if (!unique.has(key)) {
      unique.set(key, item);
    }
  });

  return Array.from(unique.values());
};

interface OverpassElement {
  id?: number | string;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  bounds?: {
    minlat: number;
    minlon: number;
    maxlat: number;
    maxlon: number;
  };
  geometry?: Array<{
    lat: number;
    lon: number;
  }>;
  tags?: {
    name?: string;
    amenity?: string;
    leisure?: string;
    shop?: string;
    sport?: string;
    dog?: string;
    dogs?: string;
    [key: string]: string | undefined;
  };
}

export function Map({
  events = [],
  showPOI = false,
  className = '',
  initialCenter = [2.3522, 48.8566], // Paris [lng, lat]
  initialZoom = 12,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const poiMarkersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [poiError, setPoiError] = useState<string | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const warmupAttemptsRef = useRef<Record<string, number>>({});
  const lastPOIFetchRef = useRef<number>(0);
  const poiCacheRef = useRef<Record<string, POIMarkerData[]>>({});
  const lastBoundsRef = useRef<BoundsSnapshot | null>(null);
  const warmupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 1024);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => {
    setIsLegendOpen(!isMobileViewport);
  }, [isMobileViewport]);

  useEffect(() => {
    if (!showPOI) {
      return;
    }
    setIsLegendOpen(!isMobileViewport);
  }, [showPOI, isMobileViewport]);

  useEffect(() => {
    if (!mapLoaded || !map.current || !mapContainer.current) {
      return;
    }

    const resize = () => {
      map.current?.resize();
    };

    resize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => resize());
      observer.observe(mapContainer.current);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [mapLoaded]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 512,
            attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: initialCenter,
      zoom: initialZoom,
      fadeDuration: 100,
      trackResize: false,
    });

    map.current.on('style.load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initialCenter/Zoom are mount-only

  // Add event markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers for each event
    events.forEach((event) => {
        if (!event.lat || !event.lng) return; // Skip invalid events

        const popup = new Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: true,
          closeOnMove: false,
          maxWidth: '320px',
          className: 'event-popup',
        }).setHTML(`
          <div style="font-family:system-ui,sans-serif; padding:14px 16px; min-width:240px;">
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
              <div style="flex-shrink:0;width:40px;height:40px;background:#FFF3E0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;">🎉</div>
              <div style="flex:1;min-width:0;">
                <p style="font-size:15px;font-weight:700;color:#1f2937;margin:0 0 2px;line-height:1.3;">${escapeHtml(event.name)}</p>
              </div>
            </div>
            <p style="font-size:13px;color:#4b5563;margin:0 0 10px;line-height:1.5;">${escapeHtml(event.description || '')}</p>
            <a href="/events" style="display:block;text-align:center;padding:7px 16px;background:#D2691E;color:#fff;border-radius:999px;text-decoration:none;font-size:13px;font-weight:600;">
              Voir les événements →
            </a>
          </div>
        `);

        // Create custom marker element with paw icon
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.cssText = `
          width: 45px;
          height: 45px;
          background-color: #8B4513;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          position: relative;
          z-index: 10;
        `;
        
        el.innerHTML = `
          <svg width="26" height="26" fill="white" viewBox="0 0 512 512" style="pointer-events: none; position: relative; z-index: 1;">
            <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
          </svg>
        `; // SVG statique hardcodé — aucune donnée utilisateur injectée

        el.addEventListener('mouseenter', () => { el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)'; el.style.borderWidth = '4px'; });
        el.addEventListener('mouseleave', () => { el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)'; el.style.borderWidth = '3px'; });

        const marker = new Marker({ 
          element: el,
          anchor: 'center', // Center anchor for round markers
        })
          .setLngLat([event.lng, event.lat])
          .setPopup(popup)
          .addTo(map.current!);

        // Open popup on click - Multiple event listeners for reliability
        el.addEventListener('click', (e) => {
          if (mapDebugEnabled) {
            console.log('🎯 Event marker clicked!', event.name);
          }
          e.stopPropagation();
          marker.togglePopup();
        });

        el.addEventListener('touchend', (e) => {
          if (mapDebugEnabled) {
            console.log('👆 Event marker touched!', event.name);
          }
          e.stopPropagation();
          e.preventDefault();
          marker.togglePopup();
        });

        markersRef.current.push(marker);
    });
  }, [events, mapLoaded]);

  const MIN_MOVE_DISTANCE = 0.005; // Minimum movement in degrees (~500m)

  // Utility to calculate distance between two bounds
  // Fetch and display POIs with BEST OPTIMIZATION
  useEffect(() => {
    if (!map.current || !showPOI || !mapLoaded) {
      if (warmupTimeoutRef.current) {
        clearTimeout(warmupTimeoutRef.current);
        warmupTimeoutRef.current = null;
      }
      warmupAttemptsRef.current = {};
      if (!showPOI) {
        setIsLegendOpen(false);
      }
      // Remove POI markers if showPOI is false
      poiMarkersRef.current.forEach((marker) => marker.remove());
      poiMarkersRef.current.clear();
      return;
    }

    let isMounted = true;
    let debounceTimeout: NodeJS.Timeout;

    const fetchPOIs = async ({ force = false }: { force?: boolean } = {}) => {
      const now = Date.now();
      const MIN_INTERVAL = 500;

      // Rate limiting check
      if (!force && now - lastPOIFetchRef.current < MIN_INTERVAL) {
        if (mapDebugEnabled) {
          console.log('⏱️ POI: Waiting for rate limit...');
        }
        return;
      }

      const center = map.current?.getCenter();
      if (!center || !isMounted) return;

      const bounds = map.current?.getBounds();
      if (!bounds) return;
      const currentBounds = captureBounds(bounds);

      // Check if movement is significant enough
      const lastBounds = lastBoundsRef.current;
      if (!force && lastBounds && boundsDistance(currentBounds, lastBounds) < MIN_MOVE_DISTANCE) {
        if (mapDebugEnabled) {
          console.log('📍 POI: Minimal movement, no fetch');
        }
        return;
      }

      // Round bounds to reduce cache fragmentation (0.01 degree ≈ 1km)
      const south = Math.floor(currentBounds.south * 100) / 100;
      const west = Math.floor(currentBounds.west * 100) / 100;
      const north = Math.ceil(currentBounds.north * 100) / 100;
      const east = Math.ceil(currentBounds.east * 100) / 100;

      const cacheKey = `${south},${west},${north},${east}`;
      setPoiError(null);

      // Check cache first
      if (poiCacheRef.current[cacheKey]) {
        if (mapDebugEnabled) {
          console.log('💾 POI: Data from cache');
        }
        delete warmupAttemptsRef.current[cacheKey];
        lastBoundsRef.current = currentBounds;
        renderPOIs(poiCacheRef.current[cacheKey]);
        return;
      }

      // Update last fetch time
      lastPOIFetchRef.current = now;
      lastBoundsRef.current = currentBounds;

      try {
        const params = new URLSearchParams({
          south: south.toString(),
          west: west.toString(),
          north: north.toString(),
          east: east.toString(),
        });

        if (mapDebugEnabled) {
          console.log('🌐 POI: Fetching from backend proxy...');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`/api/pois?${params.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          setPoiError('Impossible de récupérer les points d’intérêt pour le moment. Merci de réessayer.');
          if (mapDebugEnabled) {
            console.error('❌ POI: Backend returned', response.status);
          }
          return;
        }

        const data = (await response.json()) as { elements?: OverpassElement[] };

        if (!isMounted) {
          return;
        }

        if (!data?.elements || data.elements.length === 0) {
          const attempts = warmupAttemptsRef.current[cacheKey] ?? 0;

          if (attempts < 2) {
            warmupAttemptsRef.current[cacheKey] = attempts + 1;
            setPoiError('Chargement des points d’intérêt pour cette zone, merci de patienter quelques secondes…');
            if (warmupTimeoutRef.current) {
              clearTimeout(warmupTimeoutRef.current);
            }
            warmupTimeoutRef.current = setTimeout(() => {
              if (!isMounted) return;
              if (mapDebugEnabled) {
                console.log('🔁 POI: Retrying after warmup');
              }
              fetchPOIs({ force: true });
            }, 2000);
          } else {
            delete warmupAttemptsRef.current[cacheKey];
            setPoiError("Aucun point d’intérêt enregistré pour cette zone. Lancez ‘php bin/console app:pois:refresh’ avec les coordonnées souhaitées.");
            poiMarkersRef.current.forEach((m) => m.remove());
            poiMarkersRef.current.clear();
          }
          return;
        }

        const markerData = toMarkerData(data.elements);
        poiCacheRef.current[cacheKey] = markerData;
        delete warmupAttemptsRef.current[cacheKey];
        lastBoundsRef.current = currentBounds;

        const cacheKeys = Object.keys(poiCacheRef.current);
        if (cacheKeys.length > 20) {
          delete poiCacheRef.current[cacheKeys[0]];
        }

        renderPOIs(markerData);
        if (mapDebugEnabled) {
          console.log(`✅ POI: ${markerData.length} POIs loaded`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          if (mapDebugEnabled) {
            console.warn('⏱️ POI: Timeout');
          }
        } else {
          // Always surface the underlying error to help debugging cross-environment issues
          console.error('POI fetch failed', error);
          const reason = error instanceof Error ? error.message : 'Erreur inconnue';
          setPoiError(`Erreur lors de la récupération des points d’intérêt (${reason}). Vérifiez que le backend a bien des données importées.`);
          if (mapDebugEnabled && error instanceof Error) {
            console.error('❌ POI: Error', error.message);
          }
        }
      }
    };

    const renderPOIs = (markerItems: POIMarkerData[]) => {
      if (!isMounted || !map.current) return;

      const markersData = markerItems.slice(0, 80);

      if (markersData.length === 0) {
        poiMarkersRef.current.forEach((m) => m.remove());
        poiMarkersRef.current.clear();
        if (mapDebugEnabled) {
          console.warn('\u2139\ufe0f POI: No points found for current view');
        }
        return;
      }

      // Diff-based rendering: only add/remove what changed
      const incomingKeys = new Set<string>();

      markersData.forEach(({ element, coords }) => {
        const name = element.tags?.name || 'Point d\u2019int\u00e9r\u00eat';
        const amenity = element.tags?.amenity;
        const leisure = element.tags?.leisure;
        const shop = element.tags?.shop;

        let icon = '📍';
        let color = '#6366F1';
        let typeLabel = 'Point d\u2019int\u00e9r\u00eat';

        if (amenity === 'veterinary') {
          icon = '🏥';
          color = '#EF4444';
          typeLabel = 'Clinique v\u00e9t\u00e9rinaire';
        } else if (leisure === 'dog_park') {
          icon = '🌳';
          color = '#10B981';
          typeLabel = 'Parc \u00e0 chiens';
        } else if (shop === 'pet' || shop === 'pet_food') {
          icon = '🐾';
          color = '#F97316';
          typeLabel = shop === 'pet_food' ? 'Boutique nourriture animale' : 'Boutique anim\u00e0li\u00e8re';
        } else if (amenity) {
          typeLabel = amenity.replace(/_/g, ' ');
        } else if (leisure) {
          typeLabel = leisure.replace(/_/g, ' ');
        } else if (shop) {
          typeLabel = shop.replace(/_/g, ' ');
        }

        const key = `${coords.lat.toFixed(5)}|${coords.lon.toFixed(5)}`;
        incomingKeys.add(key);

        // Skip if this marker already exists
        if (poiMarkersRef.current.has(key)) return;

        // Wrapper: MapLibre positions this element via transform — never touch it
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'width:28px;height:28px;cursor:pointer;pointer-events:auto;';

        // Inner visual: we scale this on hover, not the wrapper
        const el = document.createElement('div');
        el.className = 'custom-poi-marker';
        el.style.cssText = [
          'width:28px',
          'height:28px',
          `background-color:${color}`,
          'border-radius:50%',
          'border:2px solid white',
          'box-shadow:0 2px 6px rgba(0,0,0,0.3)',
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'font-size:14px',
          'transition:box-shadow 0.15s ease,transform 0.15s ease',
          'transform-origin:center center',
        ].join(';');
        el.textContent = icon;
        wrapper.appendChild(el);

        wrapper.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.25)'; el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.45)'; });
        wrapper.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'; });

        // Lazily build popup only on first click
        const address = formatAddress(element.tags);
        const mapsUrl = buildGoogleMapsUrl(element, coords, address);
        const popup = new Popup({ offset: 25 });
        let popupReady = false;
        el.addEventListener('click', () => {
          if (!popupReady) {
            popup.setHTML(`
              <div class="p-3">
                <h3 class="font-bold text-sm text-gray-900 mb-1">${icon} ${name}</h3>
                <p class="text-gray-600 text-xs capitalize">${typeLabel}</p>
                ${address ? `<p class="text-gray-500 text-xs mt-1">${address}</p>` : ''}
                <div class="mt-3">
                  <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-600 transition">
                    🧭 Y aller
                  </a>
                </div>
              </div>`);
            popupReady = true;
          }
        }, { once: false });

        const marker = new Marker({ element: wrapper, anchor: 'center' })
          .setLngLat([coords.lon, coords.lat])
          .setPopup(popup)
          .addTo(map.current!);

        poiMarkersRef.current.set(key, marker);
      });

      // Remove markers that are no longer in the new set
      poiMarkersRef.current.forEach((marker, key) => {
        if (!incomingKeys.has(key)) {
          marker.remove();
          poiMarkersRef.current.delete(key);
        }
      });
    };

    // Debounced fetch on map movement
    const debouncedFetchPOIs = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        fetchPOIs();
      }, 200); // UI feels instant but avoids spamming the backend during scroll
    };

    // Initial fetch
    fetchPOIs();

    // Re-fetch when map stops moving (debounced)
    map.current.on('moveend', debouncedFetchPOIs);

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(debounceTimeout);
      if (warmupTimeoutRef.current) {
        clearTimeout(warmupTimeoutRef.current);
        warmupTimeoutRef.current = null;
      }
      warmupAttemptsRef.current = {};
      if (map.current) {
        map.current.off('moveend', debouncedFetchPOIs);
      }
    };
  }, [showPOI, mapLoaded]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="relative w-full h-full bg-[#f8f4f0]" />

      {poiError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-sm px-4 py-2 rounded-full shadow-lg z-20 flex items-center gap-2">
          <span aria-hidden="true">⚠️</span>
          <span>{poiError}</span>
        </div>
      )}

      {showPOI && (
        <>
          <div
            className={`absolute z-30 transition-all duration-200 ${
              isMobileViewport
                ? 'bottom-24 left-1/2 w-[calc(100%-3rem)] max-w-md -translate-x-1/2'
                : 'bottom-6 left-6 w-64'
            } ${isLegendOpen ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-4'}
            `}
          >
            <div className="rounded-2xl border border-[#F1E5D4] bg-white/95 px-4 py-3 shadow-lg shadow-orange-200/30 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#A0522D]">Légende</p>
                  <p className="text-sm font-semibold text-[#3E2A1B]">Services repérés</p>
                </div>
                {isMobileViewport && (
                  <button
                    type="button"
                    onClick={() => setIsLegendOpen(false)}
                    className="rounded-full px-2 py-1 text-xs font-semibold text-[#8B4513] hover:bg-[#FFF2E0]"
                  >
                    Fermer
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2 text-xs text-[#5C3410] sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8B4513] text-[13px] text-white">
                    🎉
                  </span>
                  <span>Événements Woofie</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white bg-red-500 text-[13px] text-white">
                    🏥
                  </span>
                  <span>Cliniques vétérinaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white bg-green-500 text-[13px] text-white">
                    🌳
                  </span>
                  <span>Parcs à chiens</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white bg-orange-500 text-[13px] text-white">
                    🐾
                  </span>
                  <span>Boutiques &amp; soins</span>
                </div>
              </div>
            </div>
          </div>

          {isMobileViewport && (
            <button
              type="button"
              onClick={() => setIsLegendOpen((prev) => !prev)}
              className="absolute bottom-6 right-4 z-40 rounded-full border border-[#F1E5D4] bg-white/95 px-4 py-2 text-sm font-semibold text-[#8B4513] shadow-[0_10px_22px_rgba(141,62,11,0.18)] backdrop-blur transition hover:text-[#A0522D]"
            >
              {isLegendOpen ? 'Masquer la légende' : 'Voir la légende'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
