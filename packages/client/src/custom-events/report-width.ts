export const REPORT_FULL_WIDTH = 'REPORT_FULL_WIDTH';
export const REPORT_NARROW_WIDTH = 'REPORT_NARROW_WIDTH';
export const REPORT_HIDE = 'REPORT_HIDDEN';

export const setReportWidth = (narrowOrWidth: 'narrow' | 'full-width') => document.dispatchEvent(
    new CustomEvent(narrowOrWidth === 'narrow' ? REPORT_NARROW_WIDTH : REPORT_FULL_WIDTH)
);

export const hideReport = () => document.dispatchEvent(
    new CustomEvent(REPORT_HIDE)
);
