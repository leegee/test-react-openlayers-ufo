import React from 'react';
import { render, screen } from '@testing-library/react';
// import '@testing-library/jest-dom/extend-expect';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

// import type { RootState } from 'redux/store';

import FeaturesTable from '../FeaturesTable';

const mockStore = configureStore([]);

describe('FeaturesTable', () => {
    let store: any;  // RootState;
    beforeEach(() => {
        store = mockStore({
            gui: {
                locale: 'en',
            },
            map: {
                featureCollection: {
                    features: [
                        // Mocked feature data for testing
                        {
                            properties: {
                                id: 1,
                                datetime_original: '2023-01-01',
                                datetime: '2023-01-01T00:00:00Z',
                                location_text: 'Test Location',
                                report_text: 'Test Report',
                                search_score: 0.5 // Mocked search score
                            },
                            geometry: {
                                coordinates: [0, 0] // Mocked coordinates
                            }
                        }
                    ],
                    // Mocked search query
                    q: 'test'
                }
            }
        });
    });

    test('renders feature table with correct data', () => {
        render(
            <Provider store={store}>
                <FeaturesTable />
            </Provider>
        );

        // Verify if table headers are rendered
        expect(screen.getByText('report.date')).toBeInTheDocument();
        expect(screen.getByText('report.location')).toBeInTheDocument();
        expect(screen.getByText('report.report')).toBeInTheDocument();

        // Verify if feature data is rendered correctly
        expect(screen.getByText('2023-01-01')).toBeInTheDocument(); // Check datetime_original
        expect(screen.getByText('Test Location')).toBeInTheDocument(); // Check location_text
        expect(screen.getByText('Test Report')).toBeInTheDocument(); // Check report_text
    });

    // Add more test cases to cover additional functionality if needed
});
