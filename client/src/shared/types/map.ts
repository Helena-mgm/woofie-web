export interface MapEvent {
  id: number;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

export interface MapProps {
  events?: MapEvent[];
  showPOI?: boolean;
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}
