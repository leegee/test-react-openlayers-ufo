import React, { useEffect, useRef, useState } from 'react';
import { get } from 'react-intl-universal';
import type { Map } from 'ol';
import { MapBrowserEvent } from 'ol';
import Feature, { FeatureLike } from 'ol/Feature';
import Overlay from 'ol/Overlay';
import config from '@ufo-monorepo-test/config/src';
import { FEATURE_IS_HIGHLIGHT_PROP } from './VectorLayerHighlight';

import './Tooltip.css';

interface TooltipComponentProps {
    map: Map;
}

const Tooltip: React.FC<TooltipComponentProps> = ({ map }) => {
    const [overlay, setOverlay] = useState<Overlay | null>(null);
    const tooltipElementRef = useRef<HTMLDivElement>(null);

    const handleMapHover = (event: MapBrowserEvent<MouseEvent>) => {
        if (!overlay || !event.map || !event.pixel) {
            return;
        }

        let feature: FeatureLike | undefined = undefined;
        const features: FeatureLike[] = [];
        event.map.forEachFeatureAtPixel(event.pixel, (checkFeature) => {
            features.push(checkFeature);
        });

        // Skip any highlight
        feature = features.find(
            feature => !feature.get(FEATURE_IS_HIGHLIGHT_PROP)
        );

        // If there was a highlight, pop the list to allow correct count of features
        if (features.length > 1 && !feature) {
            features.pop();
        }

        if (!feature) {
            feature = features[0];
        }

        if (!feature) {
            overlay.setPosition(undefined);
        }
        else {
            let tooltipContent = '';
            const location_text = (feature as FeatureLike).get('location_text');
            if (location_text) {
                if (features.length === 1) {
                    const date = new Date((feature as FeatureLike).get('datetime'));
                    if (date) {
                        tooltipContent = '<small>' + new Intl.DateTimeFormat(config.locale).format(date) + '</small><br/>';
                    }
                }
                tooltipContent += '<b font-style="font-size:120%">' + location_text + '</b>';
                const num_points = feature.get('num_points') || features.length;
                if (num_points > 1) {
                    tooltipContent += ' x' + num_points;
                }
                const score = (feature as FeatureLike).get('search_score');
                if (score) {
                    tooltipContent += '<br/><small style="font-weight:light">Search score: ' + score + '</small>';
                }
            }
            else {
                tooltipContent = (feature as FeatureLike).get('num_points') + ' ' + get('panel.cluster_count');
            }

            if (tooltipContent) {
                tooltipElementRef.current!.innerHTML = tooltipContent;
                overlay.setPosition(event.coordinate);
            } else {
                overlay.setPosition(undefined);
            }
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
