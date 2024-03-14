export interface QueryParams {
  minlng: number;
  minlat: number;
  maxlng: number;
  maxlat: number;
  to_date?: string | undefined;
  from_date?: string | undefined;
  show_undated?: boolean;
  show_invalid_dates?: boolean;
}
