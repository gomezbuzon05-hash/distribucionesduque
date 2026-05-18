import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Folder, ChevronDown, FileText, TrendingUp, Eye, X } from 'lucide-react';

const Reportes = () => {
  const { mesasCerradas } = useContext(AppContext);
  const [openFolders, setOpenFolders] = useState({});
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState('Todos');
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const getWeeksInMonth = (year, monthIndex) => {
    const weeks = [];
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

    let current = new Date(firstDayOfMonth);
    const dayOfWeek = current.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    current.setDate(current.getDate() + diffToMonday);

    while (current <= lastDayOfMonth || weeks.length < 4) {
      const startOfWeek = new Date(current);
      const endOfWeek = new Date(current);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      if (startOfWeek > lastDayOfMonth) break;

      weeks.push({
        start: startOfWeek,
        end: endOfWeek,
        label: formatWeekLabel(startOfWeek, endOfWeek),
        total: 0,
        mesasCount: 0,
        productosCount: 0,
        mesas: []
      });

      current.setDate(current.getDate() + 7);
    }
    return weeks;
  };

  const formatWeekLabel = (start, end) => {
    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    return `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
  };

  const reportes = {};

  mesasCerradas.forEach(mesa => {
    const d = new Date(mesa.fecha);
    const mKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!reportes[mKey]) {
      reportes[mKey] = {
        year: d.getFullYear(),
        month: d.getMonth(),
        total: 0,
        mesasCount: 0,
        mesas: [],
        weeks: getWeeksInMonth(d.getFullYear(), d.getMonth())
      };
    }
  });

  mesasCerradas.forEach(mesa => {
    const d = new Date(mesa.fecha);
    const mKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    const monthData = reportes[mKey];
    monthData.total += mesa.total;
    monthData.mesasCount++;
    monthData.mesas.push(mesa);

    const week = monthData.weeks.find(w => d >= w.start && d <= new Date(w.end.getTime() + 86400000 - 1));
    if (week) {
      week.total += mesa.total;
      week.mesasCount++;
      week.productosCount += mesa.productosConsumidos || 0;
      week.mesas.push(mesa);
    }
  });

  const toggleFolder = (key) => {
    setOpenFolders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalHistorico = mesasCerradas.reduce((sum, m) => sum + m.total, 0);
  const mesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div>
      <div className="reportes-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Historial de ingresos organizado por mes y semana</p>
        </div>
        <div className="reportes-total-card card" style={{ padding: '16px 24px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-card)' }}>
          <TrendingUp size={24} color="var(--primary)" />
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total histórico</p>
            <h2 style={{ color: 'var(--primary)', fontSize: '20px', margin: 0, fontWeight: 600 }}>
              ${totalHistorico.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>

      {Object.keys(reportes).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
          <Folder size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
          <h3>Aún no hay reportes</h3>
          <p>Los reportes se generarán automáticamente cuando empieces a cerrar mesas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(reportes)
            .sort((a, b) => b[0].localeCompare(a[0])) // Descending order
            .map(([monthKey, monthData]) => {
              const isOpen = openFolders[monthKey] || false; // Cerrado por defecto
              return (
                <div key={monthKey} style={{ overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-dark)' }}>
                  <div onClick={() => toggleFolder(monthKey)} style={{ padding: '24px', backgroundColor: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Folder size={28} color="var(--primary)" />
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{mesesNombres[monthData.month]} {monthData.year}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{monthData.mesasCount} mesas cerradas</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '18px' }}>
                          ${monthData.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>total del mes</div>
                      </div>
                      <ChevronDown size={20} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {monthData.weeks.map((week, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderTop: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <FileText size={20} color="var(--text-muted)" />
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>{week.label}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{week.mesasCount} mesas · {week.productosCount} productos</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '15px' }}>
                              ${week.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => { e.stopPropagation(); setSelectedWeek(week); setSelectedDayFilter('Todos'); }}>
                              <Eye size={16} /> Detalles
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
          })}
        </div>
      )}

      {selectedWeek && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', width: '90%' }}>
            <div className="modal-header">
              <h2>Detalle: {selectedWeek.label}</h2>
              <button className="close-btn" onClick={() => setSelectedWeek(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['Todos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => {
                  const isActive = selectedDayFilter === dia;
                  return (
                    <button 
                      key={dia} 
                      onClick={() => setSelectedDayFilter(dia)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        border: isActive ? 'none' : '1px solid var(--border-color)',
                        backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-dark)',
                        color: isActive ? '#000' : 'var(--text-color)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: isActive ? '600' : '400',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>

              {selectedWeek.mesas.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No hubo mesas cerradas en esta semana.</p>
              ) : (() => {
                const filteredMesas = selectedWeek.mesas.filter(mesa => {
                  if (selectedDayFilter === 'Todos') return true;
                  return diasSemana[new Date(mesa.fecha).getDay()] === selectedDayFilter;
                });

                if (filteredMesas.length === 0) {
                  return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No hay mesas cerradas el día {selectedDayFilter}.</p>;
                }

                return (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Mesa</th>
                          <th>Titular</th>
                          <th>Método</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMesas.sort((a,b) => parseInt(a.numero) - parseInt(b.numero)).map(mesa => (
                          <tr key={mesa.id}>
                            <td style={{ color: 'var(--text-muted)' }}>
                              {new Date(mesa.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ fontWeight: 500 }}>Mesa {mesa.numero}</td>
                            <td>{mesa.titular || 'Sin titular'}</td>
                            <td>
                              <span style={{ 
                                fontSize: '12px', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                backgroundColor: mesa.metodoPago === 'Efectivo' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(25, 118, 210, 0.2)',
                                color: mesa.metodoPago === 'Efectivo' ? '#4caf50' : '#64b5f6' 
                              }}>
                                {mesa.metodoPago || 'Efectivo'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>
                              ${mesa.total.toLocaleString('es-ES')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
