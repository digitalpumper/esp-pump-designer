import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

function PumpCurveChart({ results }) {
  if (!results) return null;

  const { numberOfStages, frequency, pumpCurveCoefficients, bep } = results;

  // Calculate maxFlowRate dynamically based on BEP
  const maxFlowRate = bep * 2; // Use BEP * 2 as the maximum flow rate
  const baseFlowRates = Array.from({ length: 200 }, (_, i) => (i / 199) * maxFlowRate); // Generate flow rates up to maxFlowRate

  // Helper function to calculate head (H) for the given polynomial
  const calculateHead = (flowRate, coefficients) => {
    return coefficients.reduce(
      (sum, coef, index) => sum + coef * Math.pow(flowRate, 5 - index),
      0
    );
  };

  // Calculate base head values (H60Hz)
  const baseHeadValues = baseFlowRates.map((flowRate) =>
    calculateHead(flowRate, pumpCurveCoefficients)
  );

  // Helper function to calculate Q and H for a given frequency
  const calculateCurve = (freq) => {
    const adjustedFlowRates = baseFlowRates.map((qBase) => qBase * (freq / 60));
    const adjustedHeadValues = baseHeadValues.map(
      (hBase) => (hBase / Math.pow(60 / freq, 2)) * numberOfStages
    );
    return { adjustedFlowRates, adjustedHeadValues };
  };

  // Generate datasets for all frequencies (45–65 Hz, step 5 Hz)
  const frequencies = Array.from({ length: 5 }, (_, i) => 45 + i * 5);
  const datasets = frequencies.map((freq) => {
    const { adjustedFlowRates, adjustedHeadValues } = calculateCurve(freq);

    return {
      label: `${freq} Hz`,
      data: adjustedFlowRates.map((q, i) => ({ x: q, y: adjustedHeadValues[i] })),
      borderColor: freq === frequency ? "red" : "blue",
      borderWidth: freq === frequency ? 2 : 1,
      pointRadius: 0,
      fill: false,
    };
  });

  // Highlight the selected frequency dataset
  const { adjustedFlowRates, adjustedHeadValues } = calculateCurve(frequency);
  datasets.push({
    label: `${frequency} Hz (Selected)`,
    data: adjustedFlowRates.map((q, i) => ({ x: q, y: adjustedHeadValues[i] })),
    borderColor: "red",
    borderWidth: 3,
    pointRadius: 3,
    fill: false,
  });

  const yMax = Math.max(...datasets.flatMap((dataset) => dataset.data.map((d) => d.y))) * 1.1;

  const data = {
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `Pump Curves at Various Frequencies` },
    },
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: "Flow Rate (BPD)" },
        min: 0,
        max: maxFlowRate, // Use dynamic maxFlowRate
      },
      y: {
        title: { display: true, text: "Head (ft)" },
        min: 0,
        max: yMax,
      },
    },
  };

  return <Line data={data} options={options} />;
}

export default PumpCurveChart;
