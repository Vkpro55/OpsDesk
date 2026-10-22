import { Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<h1 className="p-4 text-2xl font-bold">OpsDesk</h1>} />
    </Routes>
  )
}
