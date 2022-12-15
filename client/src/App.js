import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing, Error, Register, DashboardApp, Compare } from "./pages";
import { Repos, SharedLayout } from "./pages/Home";
import PytorchAnalysis from "./pages/PytorchAnalysis";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SharedLayout />}>
            <Route index element={<Repos />} />
            <Route path="analyze/:id" element={<DashboardApp />} />
            <Route path="/analyzePytorch" element={<PytorchAnalysis/>}/>
            <Route path="/compare" element={<Compare />} />
          </Route>
          <Route path="/login" element={<Register />} />
          <Route path="/landing" element={<Landing />} />
          
          <Route path="*" element={<Error />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
