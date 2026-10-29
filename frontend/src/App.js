import { BrowserRouter, Routes, Route } from "react-router-dom";
import DeploymentPage from "@/pages/DeploymentPage";
import MagnifierHelpPage from "@/pages/MagnifierHelpPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter basename={process.env.PUBLIC_URL || "/"}>
        <Routes>
          <Route path="/" element={<DeploymentPage />} />
          <Route path="/aide-loupes" element={<MagnifierHelpPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
