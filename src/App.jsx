import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import CountryMap from './CountryMap.jsx';
import { contarPorCampo, filtrarTitulos, resumenTitulos, titulosPorAnio, top5 } from './calculos.js';

const rojo = '#ff3038';
const gris = '#a2a5ab';
const formato = (numero) => numero.toLocaleString('es-MX');

export default function App() {
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');
  const [anio, setAnio] = useState('');
  const [tipo, setTipo] = useState('');
  const [pais, setPais] = useState('');
  const [genero, setGenero] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [ranking, setRanking] = useState('genres');

  // Los datos se cargan una sola vez, al abrir la página.
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/netflix_titles.json`)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('No se encuentra el JSON');
        return respuesta.json();
      })
      .then(setDatos)
      .catch(() => setError('No se pudieron cargar los datos de Netflix.'));
  }, []);

  const anios = [...new Set(datos.map((x) => x.releaseYear))].sort((a, b) => b - a);
  const generos = [...new Set(datos.flatMap((x) => x.genres))].sort((a, b) => a.localeCompare(b, 'es'));

  // El mapa y la lista de países usan los otros filtros, pero NO el filtro de país.
  // De ese modo, el mapa no cambia todos sus colores al seleccionar un país.
  const sinFiltroPais = filtrarTitulos(datos, { anio, tipo, genero, busqueda });
  const cantidadesPaises = contarPorCampo(sinFiltroPais, 'countries');
  const paisesDisponibles = Object.keys(cantidadesPaises)
    .sort((a, b) => a.localeCompare(b, 'es'));

  // Si otro filtro deja sin resultados al país elegido, se limpia esa selección.
  useEffect(() => {
    if (pais && !paisesDisponibles.includes(pais)) setPais('');
  }, [pais, anio, tipo, genero, busqueda, datos]);

  const filtrados = filtrarTitulos(sinFiltroPais, { pais });
  const { total, peliculas, series, periodo } = resumenTitulos(filtrados);
  const tendencia = titulosPorAnio(filtrados);
  const mejores = top5(filtrados, ranking);
  const porTipo = [{ nombre: 'Películas', total: peliculas }, { nombre: 'Series', total: series }];
  const porcentaje = (n) => total ? `${(100 * n / total).toFixed(1)}%` : '0.0%';

  function limpiar() {
    setAnio(''); setTipo(''); setPais(''); setGenero(''); setBusqueda('');
  }

  return (
    <div className="pagina" id="inicio">
      <header>
        <h1>NETFLIX – TENDENCIAS GLOBALES</h1>
        <span className="etiqueta">◉ &nbsp; Dashboard Táctico</span>
      </header>
      <div className="filtros">
        <strong>FILTROS &nbsp; ♧</strong>
        <select aria-label="Filtrar por año" value={anio} onChange={(e) => setAnio(e.target.value)}>
          <option value="">Año</option>
          {anios.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select aria-label="Filtrar por tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Tipo de Contenido</option>
          <option value="Movie">Películas</option>
          <option value="TV Show">Series</option>
        </select>
        <select aria-label="Filtrar por país" value={pais} onChange={(e) => setPais(e.target.value)}>
          <option value="">País (todos)</option>
          {paisesDisponibles.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre} ({formato(cantidadesPaises[nombre])})
            </option>
          ))}
        </select>
        <select aria-label="Filtrar por género" value={genero} onChange={(e) => setGenero(e.target.value)}>
          <option value="">Género</option>
          {generos.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input aria-label="Buscar título" placeholder="⌕  Buscar título..." value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)} />
        <button onClick={limpiar}>Limpiar</button>
      </div>

      <main>
        {error && <p className="error">{error}</p>}
        {!error && datos.length === 0 && <p>Cargando datos...</p>}
        <section className="kpis" aria-label="Indicadores">
          <article className="kpi principal"><h3>TOTAL DE TÍTULOS</h3><b className="numero">{formato(total)}</b></article>
          <article className="kpi"><h3>DESGLOSE POR TIPO</h3><b>{formato(peliculas)} Películas</b><b>{formato(series)} Series</b></article>
          <article className="kpi"><h3>PERIODO</h3><b>{periodo}</b><span>Año de estreno</span></article>
          <article className="kpi"><h3>VISTA GENERAL</h3><b>{pais || 'Global'}</b><span>{pais ? 'País seleccionado' : 'Selección actual'}</span></article>
        </section>

        <div className="graficos" id="graficos">
          <section className="tarjeta">
            <h2>EVOLUCIÓN DE ESTRENOS POR AÑO</h2>
            <div className="grafico">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendencia} margin={{ top: 12, right: 15, left: -18, bottom: 6 }}>
                  <CartesianGrid vertical={false} stroke="#e7e7e7" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(value) => [value, 'Títulos']} />
                  <Line type="monotone" dataKey="cantidad" stroke={rojo} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="tarjeta">
            <h2>PELÍCULAS VS SERIES</h2>
            <div className="anillo-contenido">
              <div className="anillo">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={porTipo} dataKey="total" nameKey="nombre" innerRadius="53%" outerRadius="80%" strokeWidth={0}>
                    <Cell fill={rojo} /><Cell fill={gris} />
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="leyenda">
                <p><i className="bolita roja" /> Películas <strong>{porcentaje(peliculas)}</strong></p>
                <p><i className="bolita gris" /> Series <strong>{porcentaje(series)}</strong></p>
              </div>
            </div>
          </section>

          <section className="tarjeta" id="ranking">
            <div className="titulo-con-filtro">
              <h2>TOP 5 GÉNEROS Y DIRECTORES</h2>
              <select aria-label="Cambiar ranking" value={ranking} onChange={(e) => setRanking(e.target.value)}>
                <option value="genres">Géneros</option><option value="directors">Directores</option>
              </select>
            </div>
            <div className="grafico ranking-grafico">
              {mejores.length ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mejores} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nombre" width={150} tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip formatter={(value) => [value, 'Títulos']} />
                  <Bar dataKey="total" radius={[0, 3, 3, 0]}>
                    {mejores.map((x, i) => <Cell key={x.nombre} fill={i === 0 ? rojo : '#bfc6ce'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer> : <p className="sin-datos">No hay datos para este filtro.</p>}
            </div>
          </section>

          <section className="tarjeta" id="mapa">
            <h2>TÍTULOS POR PAÍS</h2>
            <CountryMap titles={sinFiltroPais} selectedCountry={pais} selectCountry={setPais} />
          </section>
        </div>
        <p className="fuente" id="fuente">Fuente: Netflix Movies and TV Shows (Kaggle).</p>
      </main>
    </div>
  );
}
