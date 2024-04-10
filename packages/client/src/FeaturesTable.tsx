import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { get } from 'react-intl-universal';
import { AgGridReact } from 'ag-grid-react';
import type { CellDoubleClickedEvent, RowStyle } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import config from '@ufo-monorepo-test/config';
import { RootState } from './redux/store';
import { setPanel, setSelectionId } from './redux/guiSlice';
import ContextMenu from './ContextMenu';
import { highlightRenderer, secondsRenderer } from './FeaturesTable/cell-renderers';

import './FeatureTable.css';

const onGridReady = (params: any) => {
    params.api.sizeColumnsToFit();
};

const defaultColDef = {
    sortable: true,
    resizable: true,
};

const initialColumnDef = (q: string | undefined) => [
    {
        headerName: get('feature_table.date'),
        field: 'datetime',
        valueFormatter: (params: any) => {
            return new Intl.DateTimeFormat(config.locale).format(new Date(params.value as string));
        },
        hide: false,
    },
    {
        headerName: get('feature_table.location'),
        field: 'location_text',
        cellRenderer: highlightRenderer,
        cellRendererParams: (params: any) => ({ q, text: params.data.location_text }),
        hide: false,
    },
    {
        headerName: get('feature_table.report'),
        field: 'report_text',
        flex: 1,
        wrapText: true,
        autoHeight: true,
        cellRenderer: highlightRenderer,
        cellRendererParams: (params: any) => ({ text: params.data.report_text }),
        hide: true,
    },
    {
        headerName: get('feature_table.shape'),
        field: 'shape',
        cellRenderer: highlightRenderer,
        cellRendererParams: (params: any) => ({ text: params.data.shape }),
        hide: true,
    },
    {
        headerName: get('feature_table.duration_seconds'),
        field: 'duration_seconds',
        type: 'numericColumn',
        cellRenderer: secondsRenderer,
        cellRendererParams: (params: any) => ({ seconds: params.data.duration_seconds }),
        hide: false
    },
];

const FeatureTable: React.FC = () => {
    const dispatch = useDispatch();
    const { featureCollection, q } = useSelector((state: RootState) => state.map);
    const { panel } = useSelector((state: RootState) => state.gui);
    const { selectionId } = useSelector((state: RootState) => state.gui);
    const gridRef = useRef<AgGridReact>(null);
    const navigate = useNavigate();

    const [contextMenu, setContextMenu] = useState({
        isOpen: false,
        x: 0,
        y: 0,
        rowData: null,
    });

    useEffect(() => {
        const v = (e: Event) => e.preventDefault();
        window.addEventListener('contextmenu', v);
        return () => window.removeEventListener('contextmenu', v)
    });

    const handleDoubleClick = (event: CellDoubleClickedEvent) => {
        showDetails(Number(event.data.id));
    }

    const handleContextMenu = (event: any) => {
        const mouseEvent = event.event as MouseEvent;
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();

        setContextMenu({
            isOpen: true,
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
            rowData: event.node.data,
        });

        return false;
    };

    const showDetails = (id: number) => {
        navigate(`/sighting/${id}`);
    }

    const showPointOnMap = (id: number) => {
        dispatch(setPanel('narrow'));
        dispatch(setSelectionId(Number(id)));
    };

    const ContextMenuActionCallback = (action: string, data: any) => {
        switch (action) {
            case 'showPointOnMap':
                showPointOnMap(Number(data.id));
                break;
            case 'showDetails':
                showDetails(Number(data.id));
                break;
            default:
                break;
        }

        setContextMenu({
            ...contextMenu,
            isOpen: false,
        });
    };

    const [columns, setColumns] = useState(initialColumnDef(q));

    const getRowStyleHighlightingSelection = (params: any): RowStyle | undefined => {
        if (params.data.id === selectionId) {
            return { background: 'var(--ufo-brand-clr', color: 'var(--ufo-brand-clr-fg', };
        }
        return undefined;
    };

    // Show even hidden columns when in full width mode
    useEffect(() => {
        const newColumns = panel === 'full' ? initialColumnDef(q) : initialColumnDef(q).filter(col => !col.hide);
        setColumns(newColumns);
    }, [panel, q]);

    const onGridColumnsChanged = () => {
        if (gridRef.current?.api) {
            gridRef.current.api.setColumnsVisible(['report_text', 'shape'], panel === 'full');
            // Force refresh to resize columns
            gridRef.current.api.refreshCells({ force: true });
        }
    };

    // useEffect(() => {
    //     onGridColumnsChanged();
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [columns]);

    const rowData = featureCollection?.features.map((feature) => ({ ...feature.properties })) ?? [];

    return (
        <section id="features-table" className="ag-theme-alpine-dark">
            <AgGridReact
                ref={gridRef}
                columnDefs={columns}
                rowData={rowData}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onGridColumnsChanged={onGridColumnsChanged}
                getRowStyle={getRowStyleHighlightingSelection}
                onCellContextMenu={handleContextMenu}
                onCellDoubleClicked={handleDoubleClick}
            />
            <ContextMenu
                isOpen={contextMenu.isOpen}
                onAction={ContextMenuActionCallback}
                rowData={contextMenu.rowData}
                x={contextMenu.x}
                y={contextMenu.y}
            />
        </section>
    );
};

export default FeatureTable;
