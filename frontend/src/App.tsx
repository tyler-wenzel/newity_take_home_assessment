import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { BorrowerQueuePage } from "./pages/BorrowerQueuePage"
import { ChecklistPage } from "./pages/ChecklistPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BorrowerQueuePage />} />
        <Route path="/applications/:applicationId" element={<ChecklistPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
