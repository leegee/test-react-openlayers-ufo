import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';
import { useSelector } from 'react-redux';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);


const Histogram: React.FC = () => {
    const featureCollection = useSelector((state: any) => state.map.featureCollection);
    const [data, setData] = useState<any>(null);
    const [options, setOptions] = useState<any>(null);

    useEffect(() => {
        if (!featureCollection || !featureCollection.features) return;

        const yearValues = featureCollection.features.map((feature: any /*todo*/) => new Date(feature.properties.datetime).getFullYear());

        // Finding the lowest and highest values
        const lowestValue = Math.min(...yearValues);
        const highestValue = Math.max(...yearValues);

        console.log({ lowestValue, highestValue });

        const newOptions = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                    display: true,
                    text: 'Chart.js Bar Chart',
                },
            },
        };

        const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

        const newData = {
            labels,
            datasets: [
                {
                    label: 'Dataset 2',
                    data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                    backgroundColor: 'orange',
                },
            ],
        };

        setData(newData);
        setOptions(newOptions);
    }, [featureCollection]);


    return (
        <div>
            <h2>Histogram</h2>
            {data && <Bar data={data} options={options} />}
        </div>
    );
};

export default Histogram;
