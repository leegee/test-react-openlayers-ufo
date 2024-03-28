import type { FeatureCollection } from "geojson";

export interface SearchParams {
  to_date?: string | undefined;
  from_date?: string | undefined;
  show_undated?: boolean;
  show_invalid_dates?: boolean;
  q?: string;
  q_subject?: string;
  sort_order?: 'ASC' | 'DESC'
}

export interface MvtParams extends SearchParams {
  x: number;
  y: number;
  z: number;
}

export interface QueryParams extends SearchParams {
  minlng: number;
  minlat: number;
  maxlng: number;
  maxlat: number;
  zoom: number;
}

export interface DateTimeMinMax {
  min: number | undefined;
  max: number | undefined;
}

export interface MapDictionary {
  datetime: DateTimeMinMax | undefined;
}

export type QueryResponseType = {
  msg: string;
  status: number;
  dictionary: MapDictionary;
  results: FeatureCollection | undefined;
};

export interface FetchSightingDetailsResponse {
  msg?: string;
  status: number;
  details: SightingRecordType
}

export type SightingRecordType = {
  [key: string]: string | number | undefined | null
}

