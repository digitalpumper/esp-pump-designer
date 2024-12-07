import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PumpForm from "./components/PumpForm";
import PumpCurveCreator from "./components/PumpCurveCreator";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PumpForm />} />
        <Route path="/pump-curve-creator" element={<PumpCurveCreator />} />
      </Routes>
    </Router>
  );
}

export default App;
