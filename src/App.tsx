
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import AppRoutes from '@/app/routes/index'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AppRoutes />} />
            </Routes>
        </Router>
    )
}

export default App
