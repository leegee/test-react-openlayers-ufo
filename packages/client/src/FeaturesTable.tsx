import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { get } from 'react-intl-universal';
import { AgGridReact } from 'ag-grid-react';
import type { RowStyle } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import config from '@ufo-monorepo-test/config';
import { RootState } from './redux/store';
import { setPanel, setSelectionId } from './redux/guiSlice';
import ContextMenu from './ContextMenu';

import './FeatureTable.css';

const onGridReady = (params: any) => {
    params.api.sizeColumnsToFit();
};

const defaultColDef = {
    sortable: true,
    resizable: true,
};

const FeatureTable: React.FC = () => {
    const dispatch = useDispatch();
    const { featureCollection, q } = useSelector((state: RootState) => state.map);
    const { panel } = useSelector((state: RootState) => state.gui);
    const { selectionId } = useSelector((state: RootState) => state.gui);
    const gridRef = useRef<AgGridReact>(null);
    const navigate = useNavigate();

    const [contextMenu, setContextMenu] = useState({
        isOpen: false,
        x: 110,
        y: 110,
        rowData: null,
    });

    useEffect(() => {
        const v = () => void (0);
        window.addEventListener('contextmenu', v);
        return () => window.removeEventListener('contextmenu', v)
    });

    const handleContextMenu = (event: any) => {
        const mouseEvent = event.event as MouseEvent;
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();
        console.log(event);

        setContextMenu({
            isOpen: true,
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
            rowData: event.node.data,
        });

        return false;
    };

    const handleAction = (action: string, data: any) => {
        switch (action) {
            case 'showPointOnMap':
                console.log('View on map:', data);
                showPointOnMap(data.id as string);
                break;
            case 'showDetails':
                navigate(`/sighting/${data.id}`);
                break;
            default:
                break;
        }

        setContextMenu({
            ...contextMenu,
            isOpen: false,
        });
    };

    const actionsRenderer = (params: any) => {
        return (
            <span className='ctrls'>
                <span
                    className='ctrl row-goto-map'
                    onClick={() => showPointOnMap(params.id as string)}
                />
                <Link
                    className='ctrl row-goto-details'
                    to={`/sighting/${params.data.id}`}
                />
            </span>
        );
    };

    interface highlightTextArgType { q: string | undefined, text: string }

    const highlightRenderer = ({ text }: highlightTextArgType) => {
        if (!text || !q || q.trim() === '') {
            return <>{text}</>;
        }
        const parts = text.split(new RegExp(`(${q})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === q.toLowerCase() ? (
                <mark key={index}>{part}</mark>
            ) : (
                <React.Fragment key={index}>{part}</React.Fragment>
            )
        );
    };

    const initialColumnDef = [
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
            cellRendererParams: (params: any) => ({ text: params.data.location_text }),
            hide: false,
        },
        {
            headerName: get('feature_table.report'),
            field: 'report_text',
            cellRenderer: highlightRenderer,
            cellRendererParams: (params: any) => ({ text: params.data.report_text }),
            hide: true,  // Initially hidden
        },
        {
            headerName: get('feature_table.shape'),
            field: 'shape',
            cellRenderer: highlightRenderer,
            cellRendererParams: (params: any) => ({ text: params.data.shape }),
            hide: true,  // Initially hidden
        },
        {
            headerName: get('feature_table.duration_seconds'),
            field: 'duration_seconds',
            hide: false
        },
        {
            headerName: '',
            field: 'ctrls',
            cellRenderer: actionsRenderer,
            cellRendererParams: { dispatch, setPanel, setSelectionId },
            hide: true,
        },
    ];

    const getRowStyle = (params: any): RowStyle | undefined => {
        if (params.data.id === selectionId) {
            return { background: 'lightblue' };  // Highlight color
        }
        return undefined;
    };

    const showPointOnMap = (id: number | string) => {
        dispatch(setPanel('narrow'));
        dispatch(setSelectionId(Number(id)));
    };

    const [columns, setColumns] = useState(initialColumnDef);

    useEffect(() => {
        const newColumns = panel === 'full' ? initialColumnDef : initialColumnDef.filter(col => !col.hide);
        setColumns(newColumns);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panel]);

    const onGridColumnsChanged = () => {
        if (gridRef.current?.api) {
            if (panel === 'full') {
                gridRef.current.api.setColumnsVisible(['report_text', 'shape'], true);
                gridRef.current.api.setColumnWidths([
                    { key: 'report_text', newWidth: 200 },
                    { key: 'shape', newWidth: 150 },
                ]);
            } else {
                gridRef.current.api.setColumnsVisible(['report_text', 'shape'], false);
            }

            gridRef.current.api.setColumnWidths([
                { key: 'ctrls', newWidth: 0 },
            ]);

            // Force refresh to resize columns
            gridRef.current.api.refreshCells({ force: true });
        }
    };


    useEffect(() => {
        console.log(`columns changed:  ${columns.length} columns`)
        onGridColumnsChanged();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns]);

    const rowData = featureCollection?.features.map((feature: any) => ({
        ...feature.properties,
        id: feature.properties.id,
    })) ?? [];

    return (
        <section className="ag-theme-alpine-dark" style={{ height: '90vh', width: 'auto' }}>
            <AgGridReact
                ref={gridRef}
                columnDefs={columns}
                rowData={rowData}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onGridColumnsChanged={onGridColumnsChanged}
                getRowStyle={getRowStyle}
                onCellContextMenu={handleContextMenu}
            />
            <ContextMenu
                isOpen={contextMenu.isOpen}
                onAction={handleAction}
                rowData={contextMenu.rowData}
                x={contextMenu.x}
                y={contextMenu.y}
            />
        </section>
    );
};

export default FeatureTable;
