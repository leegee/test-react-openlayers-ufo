import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import type { EnhancedStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

import { get } from 'react-intl-universal';

jest.mock('@ufo-monorepo/config', () => ({
    __esModule: true,
    default: {
    },
}));

import { setupLocale } from '../components/LocaleManager';
import FeaturesTable from '../components/FeaturesTable';

const mockStore = configureStore([]);

describe('FeaturesTable', () => {
    beforeAll(async () => {
        await setupLocale('en');
    });

    let store: EnhancedStore;

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
                                datetime: '2023-01-01T00:00:00Z',
                                location_text: 'Test Location',
                                report_text: 'Test Report',
                                search_score: 0.5,
                            },
                            geometry: {
                                coordinates: [0, 0],
                            }
                        }
                    ],
                    q: 'test'
                }
            }
        });
    });

    test('renders feature table with correct data', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <FeaturesTable />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(get('feature_table.date'))).toBeInTheDocument();
        expect(screen.getByText('2023-01-01')).toBeInTheDocument();

        expect(screen.getByText(get('feature_table.location'))).toBeInTheDocument();
        expect(screen.getByText('Test Location')).toBeInTheDocument();

        // expect(screen.getByText(get('feature_table.report'))).toBeInTheDocument();
        // expect(screen.getByText('Test Report')).toBeInTheDocument();
    });

});
