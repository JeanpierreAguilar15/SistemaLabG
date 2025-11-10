import Link from 'next/link';
import { Header } from '../components/header';
import { ResultsSection } from '../../../components/data/results.client';
import { ResultsKpis } from '../../../components/data/results-kpis.client';

export default function Page(){
  return (
    <section aria-label="resultados" className="space-y-5">
      <Header
        meta="Resultados"
        title="Resultados de analisis"
        subtitle="Visualiza, descarga y comparte tus informes clinicos"
        actions={<Link className="btn-link" href="/historial">Ver historial</Link>}
      />
      <ResultsKpis />
      <div className="portal-grid cols-2">
        <ResultsSection />
        <div className="panel">
          <div className="panel-heading">Acciones rapidas</div>
          <div className="panel-sub">Gestiona tus resultados con un par de clics.</div>
          <div className="action-tiles mt-4">
            <Link href="/historial" className="action-tile">
              <div>
                <div className="action-title">Descargar historial</div>
                <div className="action-sub">Exporta todos los resultados en PDF</div>
              </div>
              <span className="action-chevron" aria-hidden>→</span>
            </Link>
            <Link href="/perfil" className="action-tile">
              <div>
                <div className="action-title">Compartir con medico</div>
                <div className="action-sub">Actualiza tus datos de contacto</div>
              </div>
              <span className="action-chevron" aria-hidden>→</span>
            </Link>
            <Link href="/cotizaciones" className="action-tile">
              <div>
                <div className="action-title">Solicitar nuevas pruebas</div>
                <div className="action-sub">Genera una cotizacion personalizada</div>
              </div>
              <span className="action-chevron" aria-hidden>→</span>
            </Link>
          </div>
          <div className="alert-banner mt-4">
            Consejos: verifica que tus datos personales esten actualizados antes de compartir resultados con terceros.
          </div>
        </div>
      </div>
    </section>
  );
}
