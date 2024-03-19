// custom-events/point-show.ts

export interface ShowPointEventType extends CustomEvent {
    detail: {
        id?: string;
        coords?: [number, number];
    } & ({ id: string } | { coords: [number, number] }); // ie one of either id or coords
}

export const EVENT_SHOW_POINT = 'ufo-show-point';

export const showPoint = (id: number | string) => document.dispatchEvent(
    new CustomEvent(EVENT_SHOW_POINT, { detail: { id: id } }) as ShowPointEventType
);

export const showPointByCoords = (coords: [number, number]) => document.dispatchEvent(
    new CustomEvent(EVENT_SHOW_POINT, { detail: { coords: coords } }) as ShowPointEventType
);
