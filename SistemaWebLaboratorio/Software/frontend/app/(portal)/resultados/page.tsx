import { Header } from '../components/header';
import { ResultsSection } from '../../../components/data/results.client';
import { ResultsKpis } from '../../../components/data/results-kpis.client';

export default function Page(){
  return (
    <section aria-label="resultados">
      <Header title="Resultados de Análisis" subtitle="Visualiza y descarga tus resultados" />
      <ResultsKpis />
      <div className="mt-4">
        <ResultsSection />
      </div>
    </section>
  );
}
