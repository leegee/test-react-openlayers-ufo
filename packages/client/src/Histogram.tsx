import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';
import { selectPointsCount } from './redux/mapSlice';
import { dispatchCloseModalEvent } from './Modal';
import { RootState } from 'redux/store';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);


const Histogram: React.FC = () => {
    const pointsCount = useSelector(selectPointsCount);
    const { from_date, to_date, q, featureCollection } = useSelector((state: RootState) => state.map);
    const [data, setData] = useState<any>(null);
    const [yearOneCount, setYearOneCount] = useState(0);
    const [options, setOptions] = useState<any>(null);

    if (!pointsCount) {
        dispatchCloseModalEvent();
    }

    useEffect(() => {
        if (!featureCollection || !featureCollection.features) return;

        const yearValues: number[] = featureCollection.features
            .map((feature: any) => new Date(feature.properties.datetime).getFullYear())
            .filter(year => {
                // Filter out year 1, which currently represents bad dates
                if (year === 1) {
                    setYearOneCount(yearOneCount + 1);
                }
                return year !== 1;
            });

        const lowestYear = Math.min(...yearValues);
        const highestYear = Math.max(...yearValues);

        const yearCount: { [year: number]: number } = {};

        yearValues.forEach(year => {
            yearCount[year] = (yearCount[year] || 0) + 1;
        });

        // Include the years without reports
        for (let year = lowestYear; year <= highestYear; year++) {
            if (!yearCount[year]) {
                yearCount[year] = 0;
            }
        }

        const newOptions = {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: false,
                    text: '',
                },
            }
        };

        const newData = {
            labels: Object.keys(yearCount),
            datasets: [
                {
                    data: Object.values(yearCount),
                    backgroundColor: 'orange',
                },
            ],
        };

        setData(newData);
        setOptions(newOptions);
    }, [featureCollection]);


    return pointsCount ? (
        <section>
            <h2> {from_date} - {to_date}
                {q && <q>{q}</q>}
            </h2>
            {data && <Bar data={data} options={options} />}
            {yearOneCount && (<p>
                Excludes {yearOneCount} sightings without parsable dates.
            </p>)}
        </section>
    ) : '';
};

export default Histogram;
