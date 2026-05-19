import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { DollarSign, Users, ShoppingBag, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageTransition from '../components/PageTransition';

const Dashboard = () => {
  const { mesasCerradas } = useContext(AppContext);

  // Calcular estadisticas de hoy
  const hoy = new Date().toLocaleDateString();
  const mesasDeHoy = mesasCerradas.filter(m => new Date(m.fecha).toLocaleDateString() === hoy);
  
  const gananciasHoy = mesasDeHoy.reduce((sum, m) => sum + m.total, 0);
  const totalProductosVendidos = mesasDeHoy.reduce((sum, m) => sum + m.productosConsumidos, 0);

  // Calcular inicio (Lunes) y fin (Domingo) de la semana actual
  const ahora = new Date();
  const diaSemana = ahora.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  
  const inicioSemana = new Date(ahora);
  inicioSemana.setDate(ahora.getDate() + diffLunes);
  inicioSemana.setHours(0, 0, 0, 0);

  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);

  // Filtrar solo mesas de la semana actual
  const mesasSemana = mesasCerradas.filter(m => {
    const fecha = new Date(m.fecha);
    return fecha >= inicioSemana && fecha <= finSemana;
  });

  // Datos para gráfica dinámicos
  const chartData = [
    { name: 'Lun', ganancias: 0 },
    { name: 'Mar', ganancias: 0 },
    { name: 'Mié', ganancias: 0 },
    { name: 'Jue', ganancias: 0 },
    { name: 'Vie', ganancias: 0 },
    { name: 'Sáb', ganancias: 0 },
    { name: 'Dom', ganancias: 0 }
  ];

  mesasSemana.forEach(mesa => {
    const date = new Date(mesa.fecha);
    const day = date.getDay(); // 0 es Domingo
    const index = day === 0 ? 6 : day - 1;
    chartData[index].ganancias += mesa.total;
  });

  const totalSemana = chartData.reduce((sum, d) => sum + d.ganancias, 0);

  // Formato de rango de fechas para el subtítulo
  const formatRangoSemana = () => {
    const opcion = { day: 'numeric', month: 'short' };
    const inicio = inicioSemana.toLocaleDateString('es-ES', opcion);
    const fin = finSemana.toLocaleDateString('es-ES', { ...opcion, year: 'numeric' });
    return `${inicio} – ${fin}`;
  };

  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  };

  return (
    <PageTransition>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen del día — {formatDate()}</p>
        </div>
      </div>

      <div className="stat-cards">
        <div className="card stat-card">
          <div className="stat-icon">
            <DollarSign size={28} />
          </div>
          <div className="stat-info">
            <h3>Ingresos del día</h3>
            <div className="stat-value">${gananciasHoy.toLocaleString()}</div>
            <p>Mesas cerradas hoy</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
            <Users size={28} />
          </div>
          <div className="stat-info">
            <h3>Mesas cerradas</h3>
            <div className="stat-value">{mesasDeHoy.length}</div>
            <p>Clientes atendidos</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: '#2196f3', backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
            <ShoppingBag size={28} />
          </div>
          <div className="stat-info">
            <h3>Productos vendidos</h3>
            <div className="stat-value">{totalProductosVendidos}</div>
            <p>Unidades totales</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#fff' }}>
          <TrendingUp size={20} color="var(--primary)" />
          Ingresos por semana
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, marginLeft: 28 }}>
          {formatRangoSemana()} · Total: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>$ {totalSemana.toLocaleString('es-ES')}</span>
        </p>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e323e" />
              <XAxis dataKey="name" stroke="#8b92a5" axisLine={false} tickLine={false} tick={{ fill: '#8b92a5', fontSize: 12 }} dy={10} />
              <YAxis 
                stroke="#8b92a5" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8b92a5', fontSize: 12 }} 
                tickFormatter={(value) => `$ ${value.toLocaleString('es-ES')}`} 
                width={80}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{ backgroundColor: '#1e2128', border: '1px solid #2e323e', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [`$ ${value.toLocaleString('es-ES')}`, 'Ganancias']}
              />
              <Bar dataKey="ganancias" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={80} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Mesas cerradas hoy</h3>
        <p className="page-subtitle" style={{ marginBottom: 24 }}>Ordenadas por hora de cierre</p>
        
        <table className="data-table">
          <thead> 
            <tr>
              <th># Mesa</th>
              <th>Titular</th>
              <th>Productos</th>
              <th>Hora cierre</th>
              <th>Método de pago</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {mesasDeHoy.map((mesa, index) => (
              <tr key={mesa.id}>
                <td className='opacidad' style={{ fontWeight: 600 }}>Mesa {mesa.numero}</td>
                <td className='opacidad'>{mesa.titular}</td>
                <td className='opacidad'>{mesa.productosConsumidos} uds.</td>
                <td className='opacidad'>{mesa.horaCierre}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    fontWeight: 500,
                    backgroundColor: mesa.metodoPago === 'Efectivo' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                    color: mesa.metodoPago === 'Efectivo' ? '#4caf50' : '#2196f3'
                  }}>
                    {mesa.metodoPago || 'Efectivo'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                  ${mesa.total.toLocaleString()}
                </td>
              </tr>
            ))}
            {mesasDeHoy.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
                  Aún no hay mesas cerradas el día de hoy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
