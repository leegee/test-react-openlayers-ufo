// import React, { useEffect, useState } from 'react';
// import { Bar } from 'react-chartjs-2';
// import { useSelector } from 'react-redux';

// const Histogram: React.FC = () => {
//     const featureCollection = useSelector((state: any) => state.map.featureCollection);
//     const [data, setData] = useState<any>(null);
//     const [options, setOptions] = useState<any>(null);

//     useEffect(() => {
//         if (!featureCollection || !featureCollection.features) return;

//         const newData = {
//             labels: ['Data 1', 'Data 2', 'Data 3', 'Data 4', 'Data 5'],
//             datasets: [
//                 {
//                     label: 'Simple Bar Graph',
//                     backgroundColor: 'rgba(75,192,192,0.4)',
//                     borderColor: 'rgba(75,192,192,1)',
//                     borderWidth: 1,
//                     hoverBackgroundColor: 'rgba(75,192,192,0.6)',
//                     hoverBorderColor: 'rgba(75,192,192,1)',
//                     data: [1, 2, 3, 4, 5],
//                 },
//             ],
//         };

//         const newOptions = {
//             scales: {
//                 y: {
//                     type: 'linear', // Use linear scale for the y-axis
//                     beginAtZero: true, // Start y-axis from zero
//                     title: {
//                         display: true,
//                         text: 'Values', // Y-axis label
//                     },
//                 },
//                 x: {
//                     type: 'category', // Use category scale for the x-axis
//                     title: {
//                         display: true,
//                         text: 'Data Points', // X-axis label
//                     },
//                 },
//             },
//         };

//         setData(newData);
//         setOptions(newOptions);
//     }, [featureCollection]);

//     return (
//         <div>
//             <h2>Histogram</h2>
//             {data && <Bar data={data} options={options} />}
//         </div>
//     );
// };

// export default Histogram;

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);


const Histogram: React.FC = () => {
    const options = {
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

    const data = {
        labels,
        datasets: [
            {
                label: 'Dataset 2',
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                backgroundColor: 'orange',
            },
        ],
    };

    return (
        <div>
            <h2>Histogram</h2>
            <Bar data={data} options={options} />
        </div>
    );
};

export default Histogram;
