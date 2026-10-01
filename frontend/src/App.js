import { BrowserRouter, Routes, Route } from "react-router-dom";
import DeploymentPage from "@/pages/DeploymentPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter basename={process.env.PUBLIC_URL || "/"}>
        <Routes>
          <Route path="/" element={<DeploymentPage />}>
            <Route index element={<DeploymentPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
