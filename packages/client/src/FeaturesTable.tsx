import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { get } from 'react-intl-universal';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import config from '@ufo-monorepo-test/config';
import { RootState } from './redux/store';
import { setPanel, setSelectionId } from './redux/guiSlice';
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

    const actionsRenderer = (params: any) => {
        return (
            <>
                <span
                    className='ctrl row-goto-map'
                    onClick={() => showPointOnMap(params.data)}
                />
                <Link
                    className='ctrl row-goto-details'
                    to={`/sighting/${params.data.id}`}
                />
            </>
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
            cellRenderer: actionsRenderer,
            cellRendererParams: { dispatch, setPanel, setSelectionId },
            hide: false,
        },
    ];

    const showPointOnMap = (feature: any) => {
        dispatch(setPanel('narrow'));
        dispatch(setSelectionId(Number(feature.properties.id)));
    };

    const [columns, setColumns] = useState(initialColumnDef);

    useEffect(() => {
        const newColumns = panel === 'full' ? initialColumnDef : initialColumnDef.filter(col => !col.hide);
        setColumns(newColumns);
    }, [panel]);

    const onGridColumnsChanged = () => {
        if (gridRef.current?.api) {
            if (panel === 'full') {
                gridRef.current.api.setColumnsVisible(['report_text', 'shape'], true);

                // Set column width when panel is full
                gridRef.current.api.setColumnWidth('report_text', 200);  // Set width for report_text column
                gridRef.current.api.setColumnWidth('shape', 150);       // Set width for shape column
            } else {
                gridRef.current.api.setColumnsVisible(['report_text', 'shape'], false);
            }

            // Force refresh to resize columns
            gridRef.current.api.refreshCells({ force: true });
        }
    };


    useEffect(() => {
        console.log(`columns changed:  ${columns.length} columns`)
        onGridColumnsChanged();
    }, [columns]);

    const rowData = featureCollection?.features.map((feature: any) => ({
        ...feature.properties,
        id: feature.properties.id,
    })) ?? [];

    return (
        <div className="ag-theme-alpine-dark" style={{ height: '90vh', width: 'auto' }}>
            <AgGridReact
                ref={gridRef}
                columnDefs={columns}
                rowData={rowData}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onGridColumnsChanged={onGridColumnsChanged}
            ></AgGridReact>
        </div>
    );
};

export default FeatureTable;
