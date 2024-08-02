import logo from './logo.svg';
import './App.css';
import Form  from './modules/Forms/index.js'
import { Routes, Route } from 'react-router-dom';
import Dashboard from './modules/Dashboard/index.js';
import ProtectedRoute from './routes/protectedroute.js';

function App() {
  return (
    <Routes>
      <Route path="/" element={
      <ProtectedRoute>
        <Dashboard/>
      </ProtectedRoute>
    } />
      <Route path="/users/signin" element={<Form issignup={false}/>} />
      <Route path="/users/signup" element={<Form issignup={true}/>} />
    </Routes>
    
    
   
  );
}

export default App;
