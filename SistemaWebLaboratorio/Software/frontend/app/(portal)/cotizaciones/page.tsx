import { Header } from '../components/header';
import { QuotationItem } from '../../../components/quotation/quotation-selector.client';
import { QuotationPageClient } from '../../../components/quotation/quotation-page.client';

function getItems(): QuotationItem[]{
  return [
    { codigo_prueba:'HEMOGRAMA_COMPLETO', nombre:'Hemograma Completo', precio:12.5, categoria:'Hematología' },
    { codigo_prueba:'PERFIL_LIPIDICO', nombre:'Perfil Lipídico', precio:20, categoria:'Bioquímica' },
    { codigo_prueba:'GLUCOSA', nombre:'Análisis de Glucosa', precio:25, categoria:'Bioquímica' },
  ];
}

export default function Page(){
  const items = getItems();
  return (
    <section aria-label="cotizaciones">
      <Header title="Cotizaciones" subtitle="Selecciona los análisis que necesitas y obtén una cotización instantánea" />
      <QuotationPageClient items={items} />
    </section>
  );
}

