import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DialogflowWebhookService } from './dialogflow-webhook.service';
import {
  DialogflowResponseDto,
  AgendarCitaDto,
  PrecioExamenDto,
  RangoReferenciaDto,
  DisponibilidadDto,
  CitaInfoDto,
} from './dto/dialogflow.dto';

@ApiTags('Dialogflow Webhook')
@Controller('dialogflow')
export class DialogflowWebhookController {
  constructor(private readonly dialogflowService: DialogflowWebhookService) {}

  // ==================== EXAMENES ====================

  @Get('examenes')
  @ApiOperation({
    summary: 'Listar todos los exámenes disponibles',
    description: 'Devuelve la lista de exámenes con sus precios actuales',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de exámenes obtenida exitosamente',
  })
  async listarExamenes(): Promise<DialogflowResponseDto<PrecioExamenDto[]>> {
    return this.dialogflowService.listarExamenes();
  }

  @Get('examenes/precio/:nombre')
  @ApiOperation({
    summary: 'Consultar precio de un examen',
    description: 'Busca un examen por nombre y devuelve su precio actual',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del examen (búsqueda parcial)',
    example: 'hemograma',
  })
  @ApiResponse({
    status: 200,
    description: 'Precio del examen encontrado',
  })
  async consultarPrecio(
    @Param('nombre') nombre: string,
  ): Promise<DialogflowResponseDto<PrecioExamenDto>> {
    return this.dialogflowService.consultarPrecioExamen(nombre);
  }

  @Get('examenes/rango/:nombre')
  @ApiOperation({
    summary: 'Consultar valores de referencia de un examen',
    description: 'Devuelve los rangos normales/valores de referencia de un examen',
  })
  @ApiParam({
    name: 'nombre',
    description: 'Nombre del examen',
    example: 'glucosa',
  })
  @ApiResponse({
    status: 200,
    description: 'Valores de referencia del examen',
  })
  async consultarRango(
    @Param('nombre') nombre: string,
  ): Promise<DialogflowResponseDto<RangoReferenciaDto>> {
    return this.dialogflowService.consultarRangoExamen(nombre);
  }

  // ==================== CITAS ====================

  @Get('citas/disponibilidad')
  @ApiOperation({
    summary: 'Consultar disponibilidad de horarios',
    description: 'Devuelve los horarios disponibles para una fecha específica',
  })
  @ApiQuery({
    name: 'fecha',
    description: 'Fecha a consultar en formato YYYY-MM-DD',
    example: '2025-01-15',
    required: true,
  })
  @ApiQuery({
    name: 'servicio',
    description: 'Código del servicio (opcional)',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidad consultada exitosamente',
  })
  async consultarDisponibilidad(
    @Query('fecha') fecha: string,
    @Query('servicio') servicio?: string,
  ): Promise<DialogflowResponseDto<DisponibilidadDto>> {
    const codigoServicio = servicio ? parseInt(servicio, 10) : undefined;
    return this.dialogflowService.consultarDisponibilidad(fecha, codigoServicio);
  }

  @Post('citas/agendar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Agendar una nueva cita',
    description: 'Crea una nueva cita para un paciente en la fecha y hora especificadas',
  })
  @ApiResponse({
    status: 200,
    description: 'Cita agendada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o no hay disponibilidad',
  })
  async agendarCita(
    @Body() dto: AgendarCitaDto,
  ): Promise<DialogflowResponseDto<CitaInfoDto>> {
    return this.dialogflowService.agendarCita(dto);
  }

  @Get('citas/paciente/:cedula')
  @ApiOperation({
    summary: 'Consultar citas de un paciente',
    description: 'Devuelve las citas pendientes de un paciente identificado por su cédula',
  })
  @ApiParam({
    name: 'cedula',
    description: 'Cédula del paciente',
    example: '1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Citas del paciente obtenidas',
  })
  async consultarCitasPaciente(
    @Param('cedula') cedula: string,
  ): Promise<DialogflowResponseDto<CitaInfoDto[]>> {
    return this.dialogflowService.consultarCitasPaciente(cedula);
  }

  // ==================== WEBHOOK DIALOGFLOW CX ====================

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook para Dialogflow CX',
    description: 'Endpoint que recibe las solicitudes de fulfillment de Dialogflow CX',
  })
  @ApiResponse({
    status: 200,
    description: 'Respuesta de fulfillment',
  })
  async handleWebhook(@Body() body: any): Promise<any> {
    // Dialogflow CX envía el intent y parámetros en el body
    const tag = body.fulfillmentInfo?.tag || body.sessionInfo?.parameters?.tag || '';
    const parameters = body.sessionInfo?.parameters || {};

    let responseText = 'No entendí tu solicitud.';
    let payload: any = {};

    try {
      switch (tag) {
        case 'consultar-precio': {
          const nombre = parameters.examen || parameters['examen.original'] || '';
          if (nombre) {
            const result = await this.dialogflowService.consultarPrecioExamen(nombre);
            responseText = result.mensaje;
            payload = result.data || {};
          } else {
            const result = await this.dialogflowService.listarExamenes();
            responseText = result.mensaje;
            payload = result.data || [];
          }
          break;
        }

        case 'consultar-rango': {
          const nombre = parameters.examen || '';
          if (nombre) {
            const result = await this.dialogflowService.consultarRangoExamen(nombre);
            responseText = result.mensaje;
            payload = result.data || {};
          }
          break;
        }

        case 'consultar-disponibilidad': {
          const fecha = parameters.fecha || new Date().toISOString().split('T')[0];
          const servicio = parameters.servicio ? parseInt(parameters.servicio) : undefined;
          const result = await this.dialogflowService.consultarDisponibilidad(fecha, servicio);
          responseText = result.mensaje;
          payload = result.data || {};
          break;
        }

        case 'agendar-cita': {
          const dto: AgendarCitaDto = {
            fecha: parameters.fecha,
            hora: parameters.hora,
            cedula_paciente: parameters.cedula,
            examen: parameters.examen,
            codigo_servicio: parameters.servicio ? parseInt(parameters.servicio) : undefined,
          };

          if (dto.fecha && dto.hora && dto.cedula_paciente) {
            const result = await this.dialogflowService.agendarCita(dto);
            responseText = result.mensaje;
            payload = result.data || {};
          } else {
            responseText = 'Para agendar una cita necesito: fecha, hora y tu número de cédula.';
          }
          break;
        }

        case 'consultar-citas': {
          const cedula = parameters.cedula || '';
          if (cedula) {
            const result = await this.dialogflowService.consultarCitasPaciente(cedula);
            responseText = result.mensaje;
            payload = result.data || [];
          } else {
            responseText = 'Por favor, proporciona tu número de cédula para consultar tus citas.';
          }
          break;
        }

        default:
          responseText = 'Lo siento, no reconozco esa acción. ¿Puedo ayudarte con precios, disponibilidad o agendar una cita?';
      }
    } catch (error) {
      responseText = 'Ocurrió un error procesando tu solicitud. Por favor, intenta de nuevo.';
    }

    // Formato de respuesta para Dialogflow CX
    return {
      fulfillment_response: {
        messages: [
          {
            text: {
              text: [responseText],
            },
          },
        ],
      },
      sessionInfo: {
        parameters: {
          ...parameters,
          lastResponse: payload,
        },
      },
    };
  }
}
