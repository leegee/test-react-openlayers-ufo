export const REPORT_FULL_WIDTH = 'REPORT_FULL_WIDTH';
export const REPORT_NARROW_WIDTH = 'REPORT_NARROW_WIDTH';
export const REPORT_HIDE = 'REPORT_HIDDEN';

export const dispatchSetReportWidthEvent = (narrowOrWidth: 'narrow' | 'full-width') => document.dispatchEvent(
    new CustomEvent(narrowOrWidth === 'narrow' ? REPORT_NARROW_WIDTH : REPORT_FULL_WIDTH)
);

export const dispatchHideReportEvent = () => document.dispatchEvent(
    new CustomEvent(REPORT_HIDE)
);

const setReportFullWidth = () => {
    document.body.classList.add(REPORT_FULL_WIDTH);
    document.body.classList.remove(REPORT_NARROW_WIDTH);
};

const setReportNarrowWidth = () => {
    document.body.classList.remove(REPORT_FULL_WIDTH);
    document.body.classList.add(REPORT_NARROW_WIDTH);
};

const reportHide = () => {
    document.body.classList.remove(REPORT_FULL_WIDTH, REPORT_NARROW_WIDTH);
};

export function addReportEvents() {
    document.addEventListener(REPORT_FULL_WIDTH, setReportFullWidth);
    document.addEventListener(REPORT_NARROW_WIDTH, setReportNarrowWidth);
    document.addEventListener(REPORT_HIDE, reportHide);
}

export function removeReportEvents() {
    document.removeEventListener(REPORT_FULL_WIDTH, setReportFullWidth);
    document.removeEventListener(REPORT_NARROW_WIDTH, setReportNarrowWidth);
    document.removeEventListener(REPORT_HIDE, reportHide);
}