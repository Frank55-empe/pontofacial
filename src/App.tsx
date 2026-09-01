import { EspelhoPonto } from './pages/EspelhoPonto';
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { BaterPonto } from './pages/BaterPonto';
import { RotaProtegida } from './components/RotaProtegida';

const Login = lazy(() => import('./pages/admin/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.Dashboard })));
const Funcionarios = lazy(() => import('./pages/admin/Funcionarios').then(m => ({ default: m.Funcionarios })));
const NovoFuncionario = lazy(() => import('./pages/admin/NovoFuncionario').then(m => ({ default: m.NovoFuncionario })));
const EspelhoPonto = lazy(() => import('./pages/admin/EspelhoPonto').then(m => ({ default: m.EspelhoPonto })));
const Relatorios = lazy(() => import('./pages/admin/Relatorios').then(m => ({ default: m.Relatorios })));

function CarregandoAdmin() {
  return (
    <div className="min-h-screen flex items-center justify-center text-brand-dark/50 text-sm">
      Carregando...
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bater-ponto" element={<BaterPonto />} />
      <Route
        path="/admin/login"
        element={<Suspense fallback={<CarregandoAdmin />}><Login /></Suspense>}
      />
      <Route
        path="/admin"
        element={<RotaProtegida><Suspense fallback={<CarregandoAdmin />}><Dashboard /></Suspense></RotaProtegida>}
      />
      <Route
        path="/admin/funcionarios"
        element={<RotaProtegida><Suspense fallback={<CarregandoAdmin />}><Funcionarios /></Suspense></RotaProtegida>}
      />
      <Route
        path="/admin/funcionarios/novo"
        element={<RotaProtegida><Suspense fallback={<CarregandoAdmin />}><NovoFuncionario /></Suspense></RotaProtegida>}
      />
      <Route
        path="/admin/espelho"
        element={<RotaProtegida><Suspense fallback={<CarregandoAdmin />}><EspelhoPonto /></Suspense></RotaProtegida>}
      />
      <Route
        path="/admin/relatorios"
        element={<RotaProtegida><Suspense fallback={<CarregandoAdmin />}><Relatorios /></Suspense></RotaProtegida>}
      />
    </Routes>
  );
}

export default App;
