// Funciones sencillas para que los cálculos puedan revisarse por separado.

// Un mismo título solo se cuenta una vez por país, género o director.
export function contarPorCampo(datos, campo) {
  const cantidades = {};
  datos.forEach((titulo) => {
    const valoresUnicos = new Set(titulo[campo] || []);
    valoresUnicos.forEach((nombre) => {
      if (nombre) cantidades[nombre] = (cantidades[nombre] || 0) + 1;
    });
  });
  return cantidades;
}

export function top5(datos, campo) {
  return Object.entries(contarPorCampo(datos, campo))
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, 5);
}

export function filtrarTitulos(datos, filtros = {}) {
  const { anio = '', tipo = '', pais = '', genero = '', busqueda = '' } = filtros;
  const texto = busqueda.trim().toLocaleLowerCase('es');
  return datos.filter((titulo) =>
    (!anio || titulo.releaseYear === Number(anio)) &&
    (!tipo || titulo.type === tipo) &&
    (!pais || titulo.countries.includes(pais)) &&
    (!genero || titulo.genres.includes(genero)) &&
    titulo.title.toLocaleLowerCase('es').includes(texto)
  );
}

export function resumenTitulos(datos) {
  const peliculas = datos.filter((titulo) => titulo.type === 'Movie').length;
  const series = datos.filter((titulo) => titulo.type === 'TV Show').length;
  const anios = datos.map((titulo) => titulo.releaseYear);
  const periodo = anios.length ? `${Math.min(...anios)}–${Math.max(...anios)}` : 'Sin datos';
  return { total: datos.length, peliculas, series, periodo };
}

export function titulosPorAnio(datos) {
  const conteos = {};
  datos.forEach((titulo) => {
    const anio = titulo.releaseYear;
    conteos[anio] = (conteos[anio] || 0) + 1;
  });
  return Object.entries(conteos)
    .map(([year, cantidad]) => ({ year: Number(year), cantidad }))
    .sort((a, b) => a.year - b.year);
}

// Escala FIJA: seleccionar un país nunca cambia los límites de color.
export function colorPorCantidad(cantidad) {
  if (cantidad === 0) return '#e0e5e8';
  if (cantidad < 10) return '#fbd6d9';
  if (cantidad < 50) return '#f7a7ad';
  if (cantidad < 200) return '#f36a73';
  if (cantidad < 1000) return '#ed4650';
  return '#e50914';
}
