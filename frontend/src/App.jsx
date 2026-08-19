import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token')
    if (!token) return <Navigate to="/login" />
    return children
}

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Navigate to="/login"/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/dashboard' element={
          <ProtectedRoute><Dashboard/></ProtectedRoute>
        } />
        <Route path='*' element={<Navigate to="/login"/>} />
      </Routes>
    </Router>
  )
}

export default App
