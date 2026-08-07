import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { BaterPonto } from './pages/BaterPonto';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Funcionarios } from './pages/admin/Funcionarios';
import { NovoFuncionario } from './pages/admin/NovoFuncionario';
import { EspelhoPonto } from './pages/admin/EspelhoPonto';
import { RotaProtegida } from './components/RotaProtegida';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bater-ponto" element={<BaterPonto />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path="/admin/funcionarios" element={<RotaProtegida><Funcionarios /></RotaProtegida>} />
      <Route path="/admin/funcionarios/novo" element={<RotaProtegida><NovoFuncionario /></RotaProtegida>} />
      <Route path="/admin/espelho" element={<RotaProtegida><EspelhoPonto /></RotaProtegida>} />
    </Routes>
  );
}

export default App;
