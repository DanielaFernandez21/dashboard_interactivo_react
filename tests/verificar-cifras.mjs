// npm run verificar: compara los cálculos de React contra cifras del CSV original.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contarPorCampo, filtrarTitulos, resumenTitulos, titulosPorAnio, top5, colorPorCantidad } from '../src/calculos.js';

const datos = JSON.parse(readFileSync(new URL('../public/data/netflix_titles.json', import.meta.url), 'utf8'));
const ref = JSON.parse(readFileSync(new URL('./referencia_csv.json', import.meta.url), 'utf8'));
let pruebas = 0;
function comprobar(condicion, mensaje) {
  assert.ok(condicion, mensaje);
  pruebas++;
}

const total = resumenTitulos(datos);
comprobar(datos.length === ref.total && new Set(datos.map(x=>x.id)).size === ref.ids_unicos, 'Registros e ID del CSV');
comprobar(total.peliculas === ref.peliculas, 'Cantidad de películas');
comprobar(total.series === ref.series, 'Cantidad de series');
comprobar(total.total === total.peliculas + total.series, 'Películas + series debe dar total');
comprobar(total.periodo === `${ref.primer_anio}–${ref.ultimo_anio}`, 'Periodo histórico');
comprobar(datos.filter(x=>x.countries.length===0).length === ref.sin_pais, 'Registros sin país');

const porAnio = Object.fromEntries(titulosPorAnio(datos).map(x=>[x.year, x.cantidad]));
comprobar(JSON.stringify(porAnio) === JSON.stringify(ref.por_anio), 'Todos los conteos por año');
comprobar(Object.values(porAnio).reduce((a,b)=>a+b,0) === ref.total, 'Años suman total');

for (const [campo, etiqueta] of [['countries','paises'], ['genres','generos'], ['directors','directores']]) {
  const cuenta = contarPorCampo(datos,campo);
  comprobar(Object.keys(cuenta).length === Object.keys(ref[etiqueta]).length, `${etiqueta}: número de categorías`);
  for (const [nombre, esperado] of Object.entries(ref[etiqueta])) {
    comprobar(cuenta[nombre] === esperado, `${etiqueta}: ${nombre} = ${esperado}`);
  }
  comprobar(top5(datos,campo).length === 5, `${campo}: top 5`);
}

for (const [nombre, caso] of Object.entries(ref.filtros)) {
  const filtrados = filtrarTitulos(datos,caso.filtro);
  const resumen = resumenTitulos(filtrados);
  comprobar(resumen.total===caso.total, `${nombre}: total`);
  comprobar(resumen.peliculas===caso.peliculas, `${nombre}: películas`);
  comprobar(resumen.series===caso.series, `${nombre}: series`);
  comprobar(resumen.periodo===caso.periodo, `${nombre}: periodo`);
}

const sinPais = filtrarTitulos(datos, { anio: 2020, tipo: 'Movie' });
const paisesDisponibles = contarPorCampo(sinPais, 'countries');
comprobar(Object.values(paisesDisponibles).every(c=>c>0), 'Lista de países no muestra ceros');
const conMexico = filtrarTitulos(sinPais, {pais:'Mexico'});
comprobar(conMexico.length === paisesDisponibles.Mexico, 'Mapa y selector muestran la misma cuenta para México');
comprobar(contarPorCampo(sinPais,'countries').Mexico === paisesDisponibles.Mexico, 'Elegir un país no debe cambiar los datos que colorean el mapa');
comprobar(colorPorCantidad(1)==='#fbd6d9' && colorPorCantidad(999)==='#ed4650' && colorPorCantidad(1000)==='#e50914', 'Escala de colores fija');
const repetido=datos.find(x=>x.id==='s3719');
comprobar(repetido.directors.filter(d=>d==='Miguel Cohan').length === 2, 'Detecta la duplicación original');
comprobar(contarPorCampo([repetido], 'directors')['Miguel Cohan'] === 1, 'Un título no duplica director');

console.log(`✔ ${pruebas.toLocaleString('es-MX')} verificaciones correctas contra el CSV original.`);
console.log(`✔ ${ref.total.toLocaleString('es-MX')} títulos = ${ref.peliculas.toLocaleString('es-MX')} películas + ${ref.series.toLocaleString('es-MX')} series.`);
console.log(`✔ ${Object.keys(ref.paises).length} países, ${Object.keys(ref.generos).length} géneros y ${Object.keys(ref.directores).length} directores contrastados.`);
console.log('✔ Fechas, filtros, totales, ausencia de datos y conteos por título validados.');
