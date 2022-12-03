import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing, Error, Register, DashboardApp } from "./pages";
import { Repos, SharedLayout } from "./pages/Home";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SharedLayout />}>
            <Route index element={<Repos />} />
            <Route path="analyze/:id" element={<DashboardApp />} />
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
