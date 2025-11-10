import type { QuotationItem } from '../../../components/quotation/quotation-selector.client';

export const fallbackCatalog: QuotationItem[] = [
  { codigo_prueba:'HEM_GLUCO', nombre:'Glucosa', precio: 6.5, categoria:'QUÍMICA SANGUÍNEA' },
  { codigo_prueba:'HEM_UREA', nombre:'Urea', precio: 7.2, categoria:'QUÍMICA SANGUÍNEA' },
  { codigo_prueba:'HEM_CREAT', nombre:'Creatinina', precio: 7.5, categoria:'QUÍMICA SANGUÍNEA' },
  { codigo_prueba:'HEM_LIPID', nombre:'Perfil Lipídico', precio: 22, categoria:'QUÍMICA SANGUÍNEA' },
  { codigo_prueba:'HEM_HEMOG', nombre:'Hemograma Completo', precio: 10.5, categoria:'HEMATOLOGÍA' },
  { codigo_prueba:'COA_TP', nombre:'TP', precio: 8.2, categoria:'COAGULACIÓN' },
  { codigo_prueba:'COA_TPT', nombre:'TTP', precio: 8.2, categoria:'COAGULACIÓN' },
  { codigo_prueba:'ENZ_TGO', nombre:'TGO/AST', precio: 9.5, categoria:'ENZIMAS' },
  { codigo_prueba:'ENZ_TGP', nombre:'TGP/ALT', precio: 9.5, categoria:'ENZIMAS' },
  { codigo_prueba:'ELEC_NA', nombre:'Sodio', precio: 6.8, categoria:'ELECTROLITOS' },
  { codigo_prueba:'ELEC_K', nombre:'Potasio', precio: 6.8, categoria:'ELECTROLITOS' },
  { codigo_prueba:'HORM_TSH', nombre:'TSH', precio: 20, categoria:'HORMONALES' },
  { codigo_prueba:'HORM_T3', nombre:'T3', precio: 16, categoria:'HORMONALES' },
  { codigo_prueba:'HORM_T4', nombre:'T4', precio: 16, categoria:'HORMONALES' },
  { codigo_prueba:'ORINA_ELE', nombre:'Elemental y Microscópico', precio: 5.8, categoria:'ORINA' },
  { codigo_prueba:'HECES_COPRO', nombre:'Coprológico', precio: 6.2, categoria:'HECES' },
  { codigo_prueba:'MIC_CULT', nombre:'Cultivo y Antibiograma', precio: 18, categoria:'MICROBIOLOGÍA' },
  { codigo_prueba:'SERO_VDRL', nombre:'VDRL', precio: 10, categoria:'SEROLOGÍA' },
  { codigo_prueba:'SERO_PSA', nombre:'PSA Cuantitativo', precio: 24, categoria:'SEROLOGÍA' },
  { codigo_prueba:'EXTR_BETA_HCG', nombre:'Beta-HCG', precio: 18, categoria:'SEROLOGÍA' },
];

