// custom-events/point-show.ts

export interface ShowPointEventType extends CustomEvent {
    detail: {
        id: string;
    };
}

export const EVENT_SHOW_POINT = 'ufo-show-row';

export const showPoint = (id: number | string) => document.dispatchEvent(
    new CustomEvent(EVENT_SHOW_POINT, { detail: { id: id } }) as ShowPointEventType
);
