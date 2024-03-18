import React, { useEffect, useRef, useState } from 'react';

import type { Map } from 'ol';
import { MapBrowserEvent } from 'ol';
import Overlay from 'ol/Overlay';
import config from '@ufo-monorepo-test/config/src';

import './Tooltip.css';

interface TooltipComponentProps {
    map: Map;
}

const Tooltip: React.FC<TooltipComponentProps> = ({ map }) => {
    const [overlay, setOverlay] = useState<Overlay | null>(null);
    const tooltipElementRef = useRef<HTMLDivElement>(null);

    const handleMapHover = (event: MapBrowserEvent<MouseEvent>) => {
        if (!overlay || !event.map || !event.pixel) return;

        const feature = event.map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
        const coordinate = event.coordinate;

        if (feature) {
            const tooltipContent = new Intl.DateTimeFormat(config.locale).format(
                feature.get('datetime')
            ) + ' ' + feature.get('location_text');

            if (tooltipContent) {
                tooltipElementRef.current!.innerHTML = tooltipContent;
                overlay.setPosition(coordinate);
            } else {
                overlay.setPosition(undefined);
            }
        } else {
            overlay.setPosition(undefined);
        }
    };

    useEffect(() => {
        if (!map) return;
        const newOverlay = new Overlay({
            element: tooltipElementRef.current!,
            offset: [10, 0],
            positioning: 'bottom-left',
            stopEvent: false,
        });

        setOverlay(newOverlay);
        map.addOverlay(newOverlay);

        map.on('pointermove', handleMapHover);

        return () => {
            map.removeOverlay(newOverlay);
        };
    }, [map]);

    useEffect(() => {
        if (!map || !overlay) return;
        map.on('pointermove', handleMapHover);
        return () => {
            map.removeOverlay(overlay);
            map.un('pointermove', handleMapHover);
        };
    }, [map, overlay]);

    return <aside ref={tooltipElementRef} className="tooltip" />;
};

export default Tooltip;
