import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import {
  TextField,
  Box,
  Typography,
  Slider,
  MenuItem,
  Select,
  Grid,
  Button,
} from "@mui/material";
import PumpCurveChart from "./PumpCurveChart";

function PumpForm() {
  const navigate = useNavigate();

  const [parameters, setParameters] = useState(() => {
    const savedParams = sessionStorage.getItem("parameters");
    return savedParams
      ? JSON.parse(savedParams)
      : {
          oilRate: "",
          waterRate: "",
          pumpDepth: "",
          intakePressure: "",
          headPressure: "",
        };
  });

  const [frequencyValue, setFrequencyValue] = useState(() => {
    return sessionStorage.getItem("frequencyValue")
      ? parseInt(sessionStorage.getItem("frequencyValue"), 10)
      : 60;
  });

  const [pumpCurves, setPumpCurves] = useState([]);
  const [selectedPumpCurve, setSelectedPumpCurve] = useState(() => {
    const savedCurve = sessionStorage.getItem("selectedPumpCurve");
    return savedCurve ? JSON.parse(savedCurve) : null;
  });

  const [calculatedResults, setCalculatedResults] = useState(() => {
    const savedResults = sessionStorage.getItem("calculatedResults");
    return savedResults ? JSON.parse(savedResults) : null;
  });

  useEffect(() => {
    const loadPumpCurvesFromCSV = async () => {
      const response = await fetch("/pump_curves.csv");
      const csvText = await response.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const curves = results.data.map((row) => ({
            label: row.PumpName,
            coefficients: [
              parseFloat(row.Coefficient5),
              parseFloat(row.Coefficient4),
              parseFloat(row.Coefficient3),
              parseFloat(row.Coefficient2),
              parseFloat(row.Coefficient1),
              parseFloat(row.Coefficient0),
            ],
            bep: parseFloat(row.BEP),
          }));
          setPumpCurves(curves);

          if (!selectedPumpCurve) {
            const defaultCurve = curves[0];
            setSelectedPumpCurve(defaultCurve); // Default to the first curve
            handleCalculate(parameters, frequencyValue, defaultCurve); // Automatically calculate for the first curve
          }
        },
      });
    };

    loadPumpCurvesFromCSV();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("parameters", JSON.stringify(parameters));
    sessionStorage.setItem("frequencyValue", frequencyValue.toString());
    sessionStorage.setItem("selectedPumpCurve", JSON.stringify(selectedPumpCurve));
    sessionStorage.setItem("calculatedResults", JSON.stringify(calculatedResults));
  }, [parameters, frequencyValue, selectedPumpCurve, calculatedResults]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setParameters({ ...parameters, [name]: value });
  };

  const handleFrequencyChange = (e, value) => {
    setFrequencyValue(value);
    handleCalculate(parameters, value, selectedPumpCurve);
  };

  const handlePumpCurveChange = (event) => {
    const selectedCurve = pumpCurves.find((curve) => curve.label === event.target.value);
    setSelectedPumpCurve(selectedCurve);
    handleCalculate(parameters, frequencyValue, selectedCurve); // Automatically calculate for the new pump
  };

  const handleCalculate = (inputParameters, frequency, pumpCurve) => {
    if (!pumpCurve) {
      alert("Please select a pump curve.");
      return;
    }

    const oilRate = parseFloat(inputParameters.oilRate) || 0;
    const waterRate = parseFloat(inputParameters.waterRate) || 0;
    const pumpDepth = parseFloat(inputParameters.pumpDepth) || 0;
    const intakePressure = parseFloat(inputParameters.intakePressure) || 0;
    const headPressure = parseFloat(inputParameters.headPressure) || 0;

    const psiToFeet = 2.31;
    const intakePressureInFeet = intakePressure * psiToFeet;
    const headPressureInFeet = headPressure * psiToFeet;
    const totalFlowRate = oilRate + waterRate;
    const totalDynamicHead = pumpDepth + headPressureInFeet - intakePressureInFeet;

    const coefficients = pumpCurve.coefficients;
    const headPerStage = coefficients.reduce(
      (sum, coef, index) => sum + coef * Math.pow(totalFlowRate, 5 - index),
      0
    );

    const adjustedHeadPerStage = headPerStage * Math.pow(frequency / 60, 2);
    const numberOfStages = Math.ceil(totalDynamicHead / adjustedHeadPerStage);

    const results = {
      totalFlowRate,
      totalDynamicHead,
      adjustedHeadPerStage,
      numberOfStages,
      frequency,
      pumpCurveCoefficients: pumpCurve.coefficients,
      bep: pumpCurve.bep,
    };

    setCalculatedResults(results);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleCalculate(parameters, frequencyValue, selectedPumpCurve);
    }
  };

  return (
    <Grid container spacing={3} sx={{ height: "100vh", overflow: "hidden" }}>
      <Grid item xs={12} md={4}>
        <Box
          component="form"
          onKeyDown={handleKeyDown}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 2,
            border: "1px solid #ccc",
            borderRadius: 2,
            height: "100%",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6">Pump Designer</Typography>

          <Select
            value={selectedPumpCurve?.label || ""}
            onChange={handlePumpCurveChange}
            fullWidth
            sx={{ marginBottom: 2 }}
          >
            {pumpCurves.map((curve) => (
              <MenuItem key={curve.label} value={curve.label}>
                {curve.label}
              </MenuItem>
            ))}
          </Select>

          <TextField
            label="Oil Rate (BOPD)"
            name="oilRate"
            type="number"
            value={parameters.oilRate}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Water Rate (BWPD)"
            name="waterRate"
            type="number"
            value={parameters.waterRate}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Pump Depth (ft)"
            name="pumpDepth"
            type="number"
            value={parameters.pumpDepth}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Pump Intake Pressure (psi)"
            name="intakePressure"
            type="number"
            value={parameters.intakePressure}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Tubing Head Pressure (psi)"
            name="headPressure"
            type="number"
            value={parameters.headPressure}
            onChange={handleChange}
            fullWidth
          />

          <Typography>Frequency: {frequencyValue} Hz</Typography>
          <Slider
            value={frequencyValue}
            onChange={handleFrequencyChange}
            min={45}
            max={65}
            step={1}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={() =>
              handleCalculate(parameters, frequencyValue, selectedPumpCurve)
            }
          >
            Calculate
          </Button>

          <Button
            variant="outlined"
            fullWidth
            sx={{ marginTop: 2 }}
            onClick={() => navigate("/pump-curve-creator")}
          >
            Go to Pump Curve Creator
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} md={8} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <PumpCurveChart results={calculatedResults} />
        </Box>

        {calculatedResults && (
          <Box sx={{ marginTop: 2, borderTop: "1px solid #ccc", paddingTop: 2 }}>
            <Typography variant="h6">Results:</Typography>
            <Typography>
              <strong>Total Flow Rate:</strong> {calculatedResults.totalFlowRate.toFixed(0)} BOPD
            </Typography>
            <Typography>
              <strong>Total Dynamic Head (TDH):</strong> {calculatedResults.totalDynamicHead.toFixed(2)} ft
            </Typography>
            <Typography>
              <strong>Adjusted Head Per Stage:</strong> {calculatedResults.adjustedHeadPerStage.toFixed(2)} ft
            </Typography>
            <Typography>
              <strong>Number of Stages:</strong> {calculatedResults.numberOfStages}
            </Typography>
            <Typography>
              <strong>Frequency:</strong> {calculatedResults.frequency} Hz
            </Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}

export default PumpForm;
