import type { FeatureCollection } from "geojson";

export interface QueryParams {
  minlng: number;
  minlat: number;
  maxlng: number;
  maxlat: number;
  to_date?: string | undefined;
  from_date?: string | undefined;
  show_undated?: boolean;
  show_invalid_dates?: boolean;
  q?: string;
  q_subject?: string;
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
