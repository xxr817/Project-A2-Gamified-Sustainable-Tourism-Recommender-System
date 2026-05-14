import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TripPlanner from "./pages/TripPlanner";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/planner" element={<TripPlanner />} />
            </Routes>
        </BrowserRouter>
    );
}
export default App;