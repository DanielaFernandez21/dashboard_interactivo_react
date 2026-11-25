import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-110m.json';
import { contarPorCampo, colorPorCantidad } from './calculos.js';

// Los límites del mapa permanecen fijos.
const mundo = feature(atlas, atlas.objects.countries);
const proyeccion = geoNaturalEarth1().fitSize([640, 330], mundo);
const dibujar = geoPath(proyeccion);

// Equivalencias entre algunos nombres del mapa y del CSV.
const nombres = {
  'United States of America': 'United States',
  'Russian Federation': 'Russia',
  'Republic of Korea': 'South Korea',
  'South Korea': 'South Korea',
  'Czechia': 'Czech Republic',
  'Türkiye': 'Turkey',
  'Viet Nam': 'Vietnam',
  'Ivory Coast': "Côte d'Ivoire",
  'United Republic of Tanzania': 'Tanzania',
};

export default function CountryMap({ titles, selectedCountry, selectCountry }) {
  const cantidades = contarPorCampo(titles, 'countries');

  function elegirPais(nombre, cantidad) {
    if (cantidad === 0) return;
    // Segundo clic: quitar la selección.
    selectCountry(selectedCountry === nombre ? '' : nombre);
  }

  return (
    <div className="map-area">
      <svg viewBox="0 0 640 330" aria-label="Mapa mundial de títulos por país" role="img">
        {mundo.features.map((country) => {
          const nombreOriginal = country.properties.name;
          const nombre = nombres[nombreOriginal] || nombreOriginal;
          const cantidad = cantidades[nombre] || 0;
          const seleccionado = selectedCountry === nombre;
          return (
            <path key={country.id} d={dibujar(country)} fill={colorPorCantidad(cantidad)}
              stroke={seleccionado ? '#222222' : '#ffffff'} strokeWidth={seleccionado ? 2.1 : 0.5}
              className={cantidad ? 'map-clickable' : ''}
              onClick={() => elegirPais(nombre, cantidad)}
              aria-label={`${nombre}: ${cantidad.toLocaleString('es-MX')} títulos`}
              tabIndex={cantidad ? 0 : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  elegirPais(nombre, cantidad);
                }
              }}>
              <title>{nombre}: {cantidad.toLocaleString('es-MX')} títulos{seleccionado ? ' (seleccionado)' : ''}</title>
            </path>
          );
        })}
      </svg>
      <div className="map-legend">
        <span>Menos títulos</span>
        <i title="0" style={{ background: '#e0e5e8' }} />
        <i title="1 a 9" style={{ background: '#fbd6d9' }} />
        <i title="10 a 49" style={{ background: '#f7a7ad' }} />
        <i title="50 a 199" style={{ background: '#f36a73' }} />
        <i title="200 a 999" style={{ background: '#ed4650' }} />
        <i title="1,000 o más" style={{ background: '#e50914' }} />
        <span>Más títulos</span>
      </div>
      <small>{selectedCountry
        ? `${selectedCountry} seleccionado · Haz clic de nuevo para quitar el filtro.`
        : 'Haz clic en un país para filtrarlo. Las coproducciones cuentan en cada país.'}</small>
    </div>
  );
}
