import React from "react";
import { Box, Typography } from "@mui/material";

function Results({ results }) {
  const { totalFlowRate, totalDynamicHead, headPerStage, numberOfStages } = results;

  return (
    <Box
      sx={{
        marginTop: 4,
        padding: 2,
        border: "1px solid #ddd",
        borderRadius: "8px",
        background: "#f9f9f9",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <Typography variant="h6">Pump Design Results</Typography>
      <Typography>Total Flow Rate: {totalFlowRate.toFixed(2)} BOPD</Typography>
      <Typography>Total Dynamic Head: {totalDynamicHead.toFixed(2)} ft</Typography>
      <Typography>Head Per Stage: {headPerStage.toFixed(2)} ft</Typography>
      <Typography>Number of Stages: {numberOfStages}</Typography>
    </Box>
  );
}

export default Results;
