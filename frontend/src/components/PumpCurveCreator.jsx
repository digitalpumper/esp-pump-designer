import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { create, all } from "mathjs";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";

const math = create(all);

function PumpCurveCreator() {
  const [image, setImage] = useState(null);
  const [mode, setMode] = useState("axis");
  const [scalingPoints, setScalingPoints] = useState([]);
  const [realWorldValues, setRealWorldValues] = useState({
    x1: "",
    x2: "",
    y1: "",
    y2: "",
  });
  const [curvePoints, setCurvePoints] = useState([]);
  const [scaledCurvePoints, setScaledCurvePoints] = useState([]);
  const [polynomial, setPolynomial] = useState(null);
  const [pumpLabel, setPumpLabel] = useState("");
  const navigate = useNavigate();

  const handlePasteImage = (event) => {
    const file = event.clipboardData.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (event) => {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (mode === "axis") {
      if (scalingPoints.length < 4) {
        setScalingPoints([...scalingPoints, { x, y }]);
      }
    } else if (mode === "curve") {
      setCurvePoints([...curvePoints, { x, y }]);
    }
  };

  const handleRealWorldChange = (event) => {
    const { name, value } = event.target;
    setRealWorldValues({ ...realWorldValues, [name]: value });
  };

  const calculateScaling = () => {
    if (scalingPoints.length !== 4) {
      alert("Please select exactly 4 scaling points.");
      return;
    }

    const { x1, x2, y1, y2 } = realWorldValues;
    if (!x1 || !x2 || !y1 || !y2) {
      alert("Please provide real-world values for all scaling points.");
      return;
    }

    const [p1, p2, p3, p4] = scalingPoints;
    const xScale = (x2 - x1) / (p2.x - p1.x);
    const yScale = (y2 - y1) / (p4.y - p3.y);

    const scaledPoints = curvePoints.map((point) => ({
      x: parseFloat(x1) + (point.x - p1.x) * xScale,
      y: parseFloat(y1) + (point.y - p3.y) * yScale,
    }));

    setScaledCurvePoints(scaledPoints);
  };

  const calculatePolynomial = () => {
    if (scaledCurvePoints.length < 6) {
      alert("Please select at least 6 points to fit a polynomial.");
      return;
    }

    const xValues = scaledCurvePoints.map((p) => p.x);
    const yValues = scaledCurvePoints.map((p) => p.y);

    const vandermondeMatrix = xValues.map((x) => [
      Math.pow(x, 5),
      Math.pow(x, 4),
      Math.pow(x, 3),
      Math.pow(x, 2),
      x,
      1,
    ]);

    const yMatrix = math.transpose([yValues]);
    const vT = math.transpose(vandermondeMatrix);
    const coefficients = math.multiply(
      math.multiply(math.inv(math.multiply(vT, vandermondeMatrix)), vT),
      yMatrix
    );

    setPolynomial(coefficients.map((coef) => coef[0]));
  };

  const exportToCSV = () => {
    if (!pumpLabel || !polynomial) {
      alert("Please ensure you have entered a label and calculated the polynomial.");
      return;
    }

    const csvContent = `PumpName,Coefficient5,Coefficient4,Coefficient3,Coefficient2,Coefficient1,Coefficient0\n${pumpLabel},${polynomial
      .map((coef) => coef.toExponential(5))
      .join(",")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "pump_curves.csv");
  };

  const formatPolynomial = () => {
    if (!polynomial) return "No polynomial calculated.";
    const terms = polynomial.map(
      (coef, index) =>
        `${coef.toExponential(5)}x^${5 - index}`
    );
    return terms.join(" + ").replace(/\+-/g, "- ");
  };

  const undoLastPoint = () => {
    if (mode === "axis") {
      if (scalingPoints.length > 0) {
        setScalingPoints(scalingPoints.slice(0, -1));
      }
    } else if (mode === "curve") {
      if (curvePoints.length > 0) {
        setCurvePoints(curvePoints.slice(0, -1));
      }
    }
  };

  const resetScaling = () => {
    setScalingPoints([]);
    setRealWorldValues({ x1: "", x2: "", y1: "", y2: "" });
  };

  const resetCurvePoints = () => {
    setCurvePoints([]);
    setScaledCurvePoints([]);
    setPolynomial(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "20px",
        padding: "20px",
        height: "100vh",
      }}
      onPaste={handlePasteImage}
    >
      {/* Navigation Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/")}
        sx={{
          position: "absolute",
          top: "10px",
          right: "10px",
          fontSize: "16px",
        }}
      >
        Back to Pump Designer
      </Button>

      <Box sx={{ flex: 1, border: "1px dashed gray", position: "relative" }}>
        <Typography variant="h6">Paste Image & Click to Select Points</Typography>
        {image && (
          <img
            src={image}
            alt="Pump Curve"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
        <canvas
          onClick={handleCanvasClick}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
        {scalingPoints.map((point, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: `${point.y}px`,
              left: `${point.x}px`,
              backgroundColor: "red",
              color: "white",
              padding: "2px",
              fontSize: "10px",
              borderRadius: "50%",
            }}
          >
            {["X1", "X2", "Y1", "Y2"][index]}
          </div>
        ))}
        {curvePoints.map((point, index) => (
          <div
            key={`curve-${index}`}
            style={{
              position: "absolute",
              top: `${point.y}px`,
              left: `${point.x}px`,
              backgroundColor: "blue",
              color: "white",
              padding: "2px",
              fontSize: "10px",
              borderRadius: "50%",
            }}
          >
            C{index + 1}
          </div>
        ))}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography variant="h6">Mode Selection</Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(e, newMode) => setMode(newMode)}
          aria-label="Mode Selection"
          sx={{ marginBottom: 2 }}
        >
          <ToggleButton value="axis" aria-label="Axis Scaling">
            Axis Scaling
          </ToggleButton>
          <ToggleButton value="curve" aria-label="Curve Selection">
            Curve Selection
          </ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="h6">Define Real-World Values</Typography>
        {["x1", "x2", "y1", "y2"].map((name, index) => (
          <TextField
            key={index}
            label={name.toUpperCase()}
            name={name}
            type="number"
            value={realWorldValues[name]}
            onChange={handleRealWorldChange}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
        ))}

        <TextField
          label="Pump Curve Label"
          value={pumpLabel}
          onChange={(e) => setPumpLabel(e.target.value)}
          fullWidth
          sx={{ marginBottom: 2 }}
        />

        <Button variant="contained" sx={{ marginBottom: 2 }} onClick={calculateScaling}>
          Scale Points
        </Button>
        <Button variant="contained" sx={{ marginBottom: 2 }} onClick={calculatePolynomial}>
          Fit Polynomial
        </Button>
        <Button variant="contained" sx={{ marginBottom: 2 }} onClick={exportToCSV}>
          Export to CSV
        </Button>
        <Button variant="outlined" sx={{ marginBottom: 2 }} onClick={undoLastPoint}>
          Undo Last Point
        </Button>
        <Button variant="outlined" sx={{ marginBottom: 2 }} onClick={resetScaling}>
          Reset Axis Scaling
        </Button>
        <Button variant="outlined" sx={{ marginBottom: 2 }} onClick={resetCurvePoints}>
          Reset Curve Points
        </Button>

        <Typography variant="h6">Scaled Curve Points</Typography>
        <Box
          sx={{
            maxHeight: "200px",
            overflowY: "auto",
            border: "1px solid #ccc",
            padding: 1,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>X (Flow Rate)</TableCell>
                <TableCell>Y (Head)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scaledCurvePoints.map((point, index) => (
                <TableRow key={index}>
                  <TableCell>{point.x.toFixed(2)}</TableCell>
                  <TableCell>{point.y.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Typography variant="h6" sx={{ marginTop: "20px" }}>
          Polynomial Coefficients
        </Typography>
        <Typography>{formatPolynomial()}</Typography>
      </Box>
    </div>
  );
}

export default PumpCurveCreator;
