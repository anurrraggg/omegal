import { Landing } from './components/Landing';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Room } from './components/Room';
import './App.css'

function App() {
  return ( 
    <BrowserRouter>
      <Routes>
        <Route path="/room" element={<Room />} />
        <Route path="/" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App