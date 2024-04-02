import type { FeatureCollection } from "geojson";

export interface GeoJSONFeature {
  id: any;
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, number|string|Date> ;
}

export type AllowedFeatureSourceAttributeType = [
  'norge-ufo' | 'mufon-kaggle' | 'not-specified'
];

export type FeatureSourceAttributeType = AllowedFeatureSourceAttributeType[0];

export function isFeatureSourceAttributeType(value: any): value is FeatureSourceAttributeType {
  const strValue = String(value);
  return ['norge-ufo', 'mufon-kaggle', 'not-specified', '', undefined].includes(strValue);
}

export interface QueryParamsType {
  minlng: number;
  minlat: number;
  maxlng: number;
  maxlat: number;
  zoom: number;
  to_date?: string | undefined;
  from_date?: string | undefined;
  q?: string;
  q_subject?: string;
  sort_order?: 'ASC' | 'DESC';
  source?: FeatureSourceAttributeType
}

export interface DateTimeMinMaxType {
  min: number | undefined;
  max: number | undefined;
}

export type SqlBitsType = {
  selectColumns: string[],
  whereColumns: string[],
  whereParams: string[],
  orderByClause?: string[],
};

export interface MapDictionaryType {
  datetime: DateTimeMinMaxType | undefined;
  selected_columns: string[];
}

export type QueryResponseType = {
  msg: string;
  status: number;
  dictionary: MapDictionaryType;
  results: FeatureCollection | undefined;
};

export interface FetchSightingDetailsResponseType {
  msg?: string;
  status: number;
  details: SightingRecordType
}

export type SightingRecordType = {
  [key: string]: string | number | undefined | null
}

export interface UfoFeatureCollectionType {
  type: "FeatureCollection";
  clusterCount: number;
  pointsCount: number;
  features: GeoJSONFeature[];
}

export interface SearchResposneType {
  msg?: string;
  status: number;
  results: UfoFeatureCollectionType;
  dictionary: MapDictionaryType;
}
