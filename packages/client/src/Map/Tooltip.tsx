import React, { useContext, useEffect, useRef, useState } from 'react';
import { MapBrowserEvent } from 'ol';
import Overlay from 'ol/Overlay';
import config from '@ufo-monorepo-test/config/src';
import { MapContext } from './MapWithTooltips';

const Tooltip: React.FC = () => {
    const { map } = useContext(MapContext);
    const [overlay, setOverlay] = useState<Overlay | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!map) return;

        const newOverlay = new Overlay({
            element: tooltipRef.current!,
            offset: [10, 0],
            positioning: 'bottom-left',
            stopEvent: false,
        });

        map.addOverlay(newOverlay);
        setOverlay(newOverlay);

        return () => {
            map.removeOverlay(newOverlay);
        };
    }, [map]);

    const handleMapHover = (event: MapBrowserEvent<MouseEvent>) => {
        if (!overlay || !event.map || !event.pixel) return;

        const feature = event.map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
        const coordinate = event.coordinate;

        if (feature) {
            const tooltipContent = new Intl.DateTimeFormat(config.locale).format(
                feature.get('datetime')
            ) + ' ' + feature.get('location_text');

            if (tooltipContent) {
                tooltipRef.current!.innerHTML = tooltipContent;
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

        map.on('pointermove', handleMapHover);

        return () => {
            map.un('pointermove', handleMapHover);
        };
    }, [map]);

    return <div ref={tooltipRef} className="tooltip" style={{ display: 'none' }} />;
};

export default Tooltip;
