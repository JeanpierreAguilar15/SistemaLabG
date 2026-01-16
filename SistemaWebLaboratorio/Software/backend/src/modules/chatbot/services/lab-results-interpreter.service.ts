import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio de Interpretación de Resultados de Laboratorio con Gemini 2.5
 *
 * Permite a los pacientes subir PDFs de sus resultados y recibir
 * una explicación en lenguaje sencillo de los valores.
 */

export interface LabResultInterpretation {
  success: boolean;
  paciente?: {
    nombre?: string;
    cedula?: string;
    fecha_nacimiento?: string;
    edad?: string;
  };
  fecha_examen?: string;
  laboratorio?: string;
  resultados: Array<{
    examen: string;
    valor: string | number;
    unidad?: string;
    valor_referencia?: string;
    estado: 'NORMAL' | 'ALTO' | 'BAJO' | 'CRITICO' | 'INDETERMINADO';
    interpretacion: string;
  }>;
  resumen_general: string;
  recomendaciones: string[];
  advertencias: string[];
  raw_response?: string;
  error?: string;
}

@Injectable()
export class LabResultsInterpreterService {
  private readonly logger = new Logger(LabResultsInterpreterService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  // Modelos en orden de preferencia (actualizados enero 2025)
  // Nota: gemini-1.5-* fueron retirados en abril 2025
  private readonly models = [
    'gemini-2.5-flash',       // Modelo principal recomendado
    'gemini-2.5-flash-lite',  // Alternativa más económica
    'gemini-2.0-flash',       // Fallback (se retira marzo 2026)
    'gemini-2.0-flash-lite',  // Fallback económico
  ];

  private readonly maxRetries = 2;
  private readonly retryDelayMs = 5000;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY no está configurada. La interpretación de resultados no funcionará.');
    }
  }

  /**
   * Llama a Gemini API con reintentos y fallback de modelos
   */
  private async callGeminiWithRetry(body: object): Promise<any> {
    let lastError: Error | null = null;

    for (const model of this.models) {
      const apiUrl = `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          this.logger.log(`Intentando con modelo ${model} (intento ${attempt}/${this.maxRetries})`);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (response.ok) {
            this.logger.log(`Éxito con modelo ${model}`);
            return await response.json();
          }

          const errorData = await response.text();

          if (response.status === 503 || response.status === 429) {
            this.logger.warn(`Modelo ${model} sobrecargado (${response.status}), reintentando...`);
            await this.delay(this.retryDelayMs * attempt);
            continue;
          }

          if (response.status === 404) {
            this.logger.warn(`Modelo ${model} no disponible, probando siguiente...`);
            break;
          }

          this.logger.error(`Error de Gemini API: ${response.status} - ${errorData}`);
          throw new Error(`Error de API: ${response.status}`);

        } catch (error) {
          lastError = error;
          if (attempt < this.maxRetries) {
            await this.delay(this.retryDelayMs * attempt);
          }
        }
      }
    }

    throw lastError || new Error('No se pudo conectar con ningún modelo de Gemini');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Interpreta un PDF de resultados de laboratorio
   */
  async interpretLabResults(base64Data: string, mimeType: string = 'application/pdf'): Promise<LabResultInterpretation> {
    if (!this.apiKey) {
      throw new BadRequestException('API Key de Gemini no configurada');
    }

    try {
      // Limpiar el base64 si tiene prefijo
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

      const prompt = `Eres un asistente médico especializado en interpretar resultados de laboratorio clínico.
Analiza este documento de resultados de laboratorio y proporciona una interpretación clara y educativa.

IMPORTANTE:
- Responde SOLO con JSON válido, sin markdown, sin \`\`\`
- Usa lenguaje sencillo que un paciente pueda entender
- NO des diagnósticos definitivos, solo interpretaciones educativas
- Siempre recomienda consultar con un médico

Estructura JSON requerida:
{
  "paciente": {
    "nombre": "nombre si está visible o null",
    "cedula": "cédula/identificación si está visible o null",
    "fecha_nacimiento": "fecha si está visible o null",
    "edad": "edad si está visible o null"
  },
  "fecha_examen": "fecha del examen en formato YYYY-MM-DD o null",
  "laboratorio": "nombre del laboratorio si está visible o null",
  "resultados": [
    {
      "examen": "nombre del examen/parámetro",
      "valor": "valor obtenido (número o texto)",
      "unidad": "unidad de medida",
      "valor_referencia": "rango de referencia normal",
      "estado": "NORMAL|ALTO|BAJO|CRITICO|INDETERMINADO",
      "interpretacion": "explicación breve en lenguaje sencillo de qué significa este valor"
    }
  ],
  "resumen_general": "Un párrafo resumiendo los hallazgos principales en lenguaje sencillo. Menciona qué valores están bien y cuáles requieren atención.",
  "recomendaciones": [
    "Lista de recomendaciones generales basadas en los resultados"
  ],
  "advertencias": [
    "Lista de advertencias importantes si hay valores críticos o fuera de rango significativo"
  ]
}

REGLAS PARA ESTADO:
- NORMAL: valor dentro del rango de referencia
- ALTO: valor por encima del rango normal
- BAJO: valor por debajo del rango normal
- CRITICO: valor muy por encima o por debajo, requiere atención urgente
- INDETERMINADO: no se puede determinar (ej: resultado cualitativo)

IMPORTANTE EN EL RESUMEN:
- Siempre incluye: "Esta interpretación es educativa y no reemplaza la consulta con su médico."
- Si hay valores críticos, enfatiza la importancia de consultar pronto.`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Bajo para respuestas más consistentes
          maxOutputTokens: 8192, // PDFs pueden tener muchos resultados
        },
      };

      const data = await this.callGeminiWithRetry(requestBody);
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new BadRequestException('No se pudo obtener respuesta de Gemini');
      }

      const parsedData = this.parseGeminiResponse(responseText);

      return {
        success: true,
        paciente: parsedData.paciente,
        fecha_examen: parsedData.fecha_examen,
        laboratorio: parsedData.laboratorio,
        resultados: parsedData.resultados || [],
        resumen_general: parsedData.resumen_general || 'No se pudo generar un resumen.',
        recomendaciones: parsedData.recomendaciones || [],
        advertencias: parsedData.advertencias || [],
        raw_response: responseText,
      };

    } catch (error) {
      this.logger.error(`Error interpretando resultados: ${error.message}`);
      return {
        success: false,
        resultados: [],
        resumen_general: '',
        recomendaciones: [],
        advertencias: [],
        error: error.message,
      };
    }
  }

  /**
   * Genera una respuesta conversacional para el chatbot
   */
  async generateChatResponse(interpretation: LabResultInterpretation): Promise<string> {
    if (!interpretation.success) {
      return `Lo siento, no pude analizar el documento. ${interpretation.error || 'Por favor, asegurate de que sea un PDF legible con resultados de laboratorio.'}`;
    }

    let response = 'INTERPRETACION DE TUS RESULTADOS DE LABORATORIO\n';
    response += '----------------------------------------\n\n';

    // Resumen general
    response += `RESUMEN:\n${interpretation.resumen_general}\n\n`;

    // Advertencias (si hay)
    if (interpretation.advertencias && interpretation.advertencias.length > 0) {
      response += 'ATENCION:\n';
      interpretation.advertencias.forEach(adv => {
        response += `  - ${adv}\n`;
      });
      response += '\n';
    }

    // Resultados destacados (fuera de rango)
    const outOfRange = interpretation.resultados.filter(r =>
      r.estado === 'ALTO' || r.estado === 'BAJO' || r.estado === 'CRITICO'
    );

    if (outOfRange.length > 0) {
      response += 'VALORES FUERA DE RANGO:\n';
      outOfRange.forEach(r => {
        const indicator = r.estado === 'CRITICO' ? '[!]' : r.estado === 'ALTO' ? '[+]' : '[-]';
        response += `\n${indicator} ${r.examen}: ${r.valor} ${r.unidad || ''} (Ref: ${r.valor_referencia || 'N/A'})\n`;
        response += `    ${r.interpretacion}\n`;
      });
      response += '\n';
    }

    // Recomendaciones
    if (interpretation.recomendaciones && interpretation.recomendaciones.length > 0) {
      response += 'RECOMENDACIONES:\n';
      interpretation.recomendaciones.forEach(rec => {
        response += `  - ${rec}\n`;
      });
    }

    response += '\n----------------------------------------\n';
    response += 'Nota: Esta interpretacion es educativa. Consulta siempre con tu medico para un diagnostico profesional.';

    return response;
  }

  /**
   * Parsea la respuesta JSON de Gemini
   */
  private parseGeminiResponse(responseText: string): Partial<LabResultInterpretation> {
    let cleanText = responseText.trim();

    // Log para diagnóstico (primeros 200 caracteres)
    this.logger.debug(`Respuesta Gemini (primeros 200 chars): ${cleanText.substring(0, 200)}`);

    // Remover bloques de código markdown si existen
    if (cleanText.includes('```json')) {
      const match = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        cleanText = match[1];
      }
    } else if (cleanText.includes('```')) {
      const match = cleanText.match(/```\s*([\s\S]*?)\s*```/);
      if (match) {
        cleanText = match[1];
      }
    }

    // Intentar encontrar el objeto JSON completo si hay texto extra
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    }

    // Función auxiliar para intentar reparar JSON truncado
    const repairTruncatedJson = (text: string): string => {
      let repaired = text;

      // Contar brackets y braces abiertos
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escape = false;

      for (const char of repaired) {
        if (escape) {
          escape = false;
          continue;
        }
        if (char === '\\') {
          escape = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          if (char === '[') bracketCount++;
          if (char === ']') bracketCount--;
        }
      }

      // Si estamos dentro de un string, cerrarlo
      if (inString) {
        repaired += '"';
      }

      // Cerrar brackets y braces pendientes
      while (bracketCount > 0) {
        repaired += ']';
        bracketCount--;
      }
      while (braceCount > 0) {
        repaired += '}';
        braceCount--;
      }

      return repaired;
    };

    // Intentar parsear con diferentes niveles de limpieza
    const cleaningStrategies = [
      // Estrategia 1: Limpieza básica
      (text: string) => text
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']'),

      // Estrategia 2: Corregir comas faltantes
      (text: string) => text
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/}\s*{/g, '},{')
        .replace(/"\s*{/g, '",{')
        .replace(/}\s*"/g, '},"'),

      // Estrategia 3: Normalizar newlines dentro de strings
      (text: string) => {
        let result = '';
        let inString = false;
        let escape = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (escape) {
            result += char;
            escape = false;
            continue;
          }
          if (char === '\\') {
            result += char;
            escape = true;
            continue;
          }
          if (char === '"') {
            inString = !inString;
            result += char;
            continue;
          }
          if (inString && (char === '\n' || char === '\r')) {
            result += ' ';
            continue;
          }
          result += char;
        }
        return result
          .replace(/[\x00-\x1F\x7F]/g, ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/}\s*{/g, '},{');
      },

      // Estrategia 4: Limpieza agresiva
      (text: string) => text
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .replace(/…/g, '...')
        .replace(/–/g, '-')
        .replace(/—/g, '-')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/}\s*{/g, '},{')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' '),

      // Estrategia 5: Reparar JSON truncado
      (text: string) => {
        let result = text
          .replace(/[\x00-\x1F\x7F]/g, ' ')
          .replace(/[""]/g, '"')
          .replace(/['']/g, "'")
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/}\s*{/g, '},{')
          .replace(/\s+/g, ' ');

        // Reparar JSON truncado
        return repairTruncatedJson(result);
      },
    ];

    let lastError: Error | null = null;
    for (let i = 0; i < cleaningStrategies.length; i++) {
      try {
        const cleaned = cleaningStrategies[i](cleanText);
        const parsed = JSON.parse(cleaned);

        if (i > 0) {
          this.logger.log(`JSON parseado exitosamente con estrategia ${i + 1}`);
        }

        return {
          paciente: parsed.paciente || undefined,
          fecha_examen: parsed.fecha_examen || undefined,
          laboratorio: parsed.laboratorio || undefined,
          resultados: Array.isArray(parsed.resultados) ? parsed.resultados : [],
          resumen_general: parsed.resumen_general || '',
          recomendaciones: Array.isArray(parsed.recomendaciones) ? parsed.recomendaciones : [],
          advertencias: Array.isArray(parsed.advertencias) ? parsed.advertencias : [],
        };
      } catch (error) {
        lastError = error;
        if (i === cleaningStrategies.length - 1) {
          const errorMatch = error.message.match(/position (\d+)/);
          if (errorMatch) {
            const pos = parseInt(errorMatch[1]);
            const context = cleanText.substring(Math.max(0, pos - 50), Math.min(cleanText.length, pos + 50));
            this.logger.warn(`Error en posición ${pos}. Contexto: ...${context}...`);
          }
          this.logger.warn(`Error parseando respuesta JSON después de ${i + 1} estrategias: ${error.message}`);
        }
      }
    }

    // Si todo falla, intentar extraer información con regex mejorado
    this.logger.warn('Todas las estrategias de parsing fallaron, extrayendo con regex');

    // Extraer paciente
    let paciente: any = undefined;
    const pacienteMatch = responseText.match(/"paciente"\s*:\s*\{([^}]+)\}/);
    if (pacienteMatch) {
      try {
        paciente = JSON.parse(`{${pacienteMatch[1]}}`);
      } catch {
        const nombreMatch = pacienteMatch[1].match(/"nombre"\s*:\s*"([^"]+)"/);
        if (nombreMatch) {
          paciente = { nombre: nombreMatch[1] };
        }
      }
    }

    // Extraer fecha_examen
    let fecha_examen: string | undefined;
    const fechaMatch = responseText.match(/"fecha_examen"\s*:\s*"([^"]+)"/);
    if (fechaMatch) {
      fecha_examen = fechaMatch[1];
    }

    // Extraer laboratorio
    let laboratorio: string | undefined;
    const labMatch = responseText.match(/"laboratorio"\s*:\s*"([^"]+)"/);
    if (labMatch) {
      laboratorio = labMatch[1];
    }

    // Extraer resultados - mejorado para el formato de Gemini
    const resultados: any[] = [];

    // Buscar el array de resultados
    const resultadosMatch = responseText.match(/"resultados"\s*:\s*\[([\s\S]*?)(?:\](?=\s*,?\s*"(?:resumen|recomendaciones|advertencias))|\]$)/);
    if (resultadosMatch) {
      const resultadosStr = resultadosMatch[1];

      // Buscar cada objeto individualmente con regex más flexible
      const objetoRegex = /\{\s*"examen"\s*:\s*"([^"]+)"[\s\S]*?"valor"\s*:\s*"?([^",}\n]+)"?[\s\S]*?"estado"\s*:\s*"([^"]+)"(?:[\s\S]*?"interpretacion"\s*:\s*"([^"]*(?:\\.[^"]*)*)")?[^}]*\}/g;

      let match;
      while ((match = objetoRegex.exec(resultadosStr)) !== null) {
        resultados.push({
          examen: match[1],
          valor: match[2].trim(),
          estado: match[3],
          interpretacion: match[4] ? match[4].replace(/\\"/g, '"').replace(/\\n/g, ' ') : 'Ver documento original.',
        });
      }

      // Si no encontró con el regex complejo, intentar uno más simple
      if (resultados.length === 0) {
        const simpleRegex = /"examen"\s*:\s*"([^"]+)"/g;
        let simpleMatch;
        while ((simpleMatch = simpleRegex.exec(resultadosStr)) !== null) {
          resultados.push({
            examen: simpleMatch[1],
            valor: 'Ver PDF',
            estado: 'INDETERMINADO',
            interpretacion: 'Ver documento original para más detalles.',
          });
        }
      }
    }

    // Extraer resumen_general - múltiples patrones
    let resumen = '';
    const resumenPatterns = [
      /"resumen_general"\s*:\s*"((?:[^"\\]|\\["\\\/bfnrt]|\\u[0-9a-fA-F]{4})*)"/,
      /"resumen_general"\s*:\s*"([^"]{20,}?)(?:"|$)/,
    ];
    for (const pattern of resumenPatterns) {
      const match = responseText.match(pattern);
      if (match && match[1] && match[1].length > 20) {
        resumen = match[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();
        break;
      }
    }

    // Extraer recomendaciones
    const recomendaciones: string[] = [];
    const recomMatch = responseText.match(/"recomendaciones"\s*:\s*\[([\s\S]*?)\]/);
    if (recomMatch) {
      const items = recomMatch[1].match(/"((?:[^"\\]|\\.)*)"/g);
      if (items) {
        items.forEach(item => {
          const cleaned = item.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();
          if (cleaned.length > 5) recomendaciones.push(cleaned);
        });
      }
    }

    // Extraer advertencias
    const advertencias: string[] = [];
    const advMatch = responseText.match(/"advertencias"\s*:\s*\[([\s\S]*?)\]/);
    if (advMatch) {
      const items = advMatch[1].match(/"((?:[^"\\]|\\.)*)"/g);
      if (items) {
        items.forEach(item => {
          const cleaned = item.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();
          if (cleaned.length > 5) advertencias.push(cleaned);
        });
      }
    }

    // Log de lo que se pudo extraer
    this.logger.log(`Extracción regex: ${resultados.length} resultados, ${recomendaciones.length} recomendaciones, resumen: ${resumen ? 'Sí' : 'No'}, paciente: ${paciente ? 'Sí' : 'No'}`);

    // Si se extrajo algo útil, devolverlo
    if (resultados.length > 0 || resumen || recomendaciones.length > 0) {
      return {
        paciente,
        fecha_examen,
        laboratorio,
        resultados,
        resumen_general: resumen || `Se encontraron ${resultados.length} resultado(s) en el análisis. Consulte con su médico para una interpretación completa.`,
        recomendaciones: recomendaciones.length > 0 ? recomendaciones : ['Consulte con su médico para una interpretación profesional de sus resultados.'],
        advertencias,
      };
    }

    // Si no se extrajo nada, mensaje informativo
    return {
      resultados: [],
      resumen_general: 'El análisis se completó pero hubo un problema al procesar el formato de la respuesta. Por favor, intenta nuevamente o consulta directamente con tu médico.',
      recomendaciones: ['Consulta con tu médico para una interpretación profesional de tus resultados.'],
      advertencias: [],
    };
  }

  /**
   * Verifica si el servicio está configurado
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
