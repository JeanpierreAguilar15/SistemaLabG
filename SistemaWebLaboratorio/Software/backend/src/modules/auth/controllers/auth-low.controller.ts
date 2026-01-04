/**
 * ===============================================================
 *  ⚠️ CONTROLADOR VULNERABLE - SOLO PARA DEMOSTRACIÓN ⚠️
 * ===============================================================
 * 
 * Endpoints vulnerables a SQL Injection para demostración educativa.
 * Similar a DVWA (Damn Vulnerable Web Application).
 * 
 * NO USAR EN PRODUCCIÓN
 * ELIMINAR DESPUÉS DEL INFORME
 * ===============================================================
 */

import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { AuthLowService } from '../services/auth-low.service';
import { Public } from '../decorators/public.decorator';

// DTO con validación mínima (solo requiere que sean strings)
// No tiene restricciones de formato - permite payloads de SQL injection
class LoginLowDto {
    @IsString()
    identifier: string;

    @IsString()
    password: string;
}

class SearchDto {
    @IsString()
    @IsOptional()
    payload: string;
}

@ApiTags('auth-vulnerable')
@Controller('auth')
export class AuthLowController {
    constructor(private readonly authLowService: AuthLowService) { }

    /**
     * ===============================================================
     * 🚨 ENDPOINT VULNERABLE: /api/v1/auth/login-low 🚨
     * ===============================================================
     * 
     * Este endpoint es INTENCIONALMENTE VULNERABLE a SQL Injection.
     * 
     * CÓMO PROBAR:
     * 
     * 1. Usando cURL:
     *    curl -X POST http://localhost:3000/api/v1/auth/login-low \
     *      -H "Content-Type: application/json" \
     *      -d '{"identifier": "'\'' OR '\''1'\''='\''1", "password": "cualquiera"}'
     * 
     * 2. Usando Postman o Thunder Client:
     *    POST http://localhost:3000/api/v1/auth/login-low
     *    Body: { "identifier": "' OR '1'='1", "password": "test" }
     * 
     * 3. Desde el navegador (si hay formulario):
     *    Identificador: ' OR '1'='1
     *    Contraseña: cualquier cosa
     * 
     * ===============================================================
     */
    @Public()
    @Post('login-low')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '⚠️ LOGIN VULNERABLE - Solo para demostración educativa',
        description: 'Este endpoint es intencionalmente vulnerable a SQL Injection. NO USAR EN PRODUCCIÓN.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                identifier: {
                    type: 'string',
                    example: "' OR '1'='1",
                    description: 'Email o cédula - VULNERABLE a SQL Injection'
                },
                password: {
                    type: 'string',
                    example: 'cualquier_cosa',
                    description: 'Contraseña - Se concatena directamente en SQL'
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Resultado del intento de login (vulnerable)',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                user: { type: 'object' },
                access_token: { type: 'string' },
                queryExecuted: { type: 'string' },
            },
        },
    })
    async loginVulnerable(@Body() loginDto: LoginLowDto) {
        return this.authLowService.loginVulnerable(
            loginDto.identifier,
            loginDto.password,
        );
    }

    /**
     * Login aún más vulnerable - sin verificación de contraseña
     */
    @Public()
    @Post('login-low-simple')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '⚠️ LOGIN SUPER VULNERABLE - Sin verificación de contraseña',
        description: 'Solo necesita el identificador. Extremadamente vulnerable.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                identifier: {
                    type: 'string',
                    example: "admin@lab.com",
                    description: 'Solo el email o cédula'
                },
            },
        },
    })
    async loginVulnerableSimple(@Body() body: { identifier: string }) {
        return this.authLowService.loginVulnerableSimple(body.identifier);
    }

    /**
     * Endpoint para demostrar extracción de datos
     */
    @Public()
    @Post('search-vulnerable')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '⚠️ BÚSQUEDA VULNERABLE - Extracción de datos',
        description: 'Permite extraer datos de usuarios mediante SQL Injection.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                payload: {
                    type: 'string',
                    example: "%' OR '1'='1",
                    description: 'Payload de búsqueda vulnerable'
                },
            },
        },
    })
    async searchVulnerable(@Body() body: SearchDto) {
        return this.authLowService.extractAllUsers(body.payload);
    }

    /**
     * Información sobre la vulnerabilidad para el informe
     */
    @Public()
    @Get('vulnerability-info')
    @ApiOperation({
        summary: 'Información sobre la vulnerabilidad SQL Injection',
        description: 'Retorna detalles técnicos para el informe de seguridad.',
    })
    getVulnerabilityInfo() {
        return this.authLowService.getVulnerabilityInfo();
    }

    /**
     * Página de ayuda con ejemplos de payloads
     */
    @Public()
    @Get('login-low/help')
    @ApiOperation({
        summary: 'Guía de payloads SQL Injection',
        description: 'Lista de payloads para probar la vulnerabilidad.',
    })
    getHelp() {
        return {
            title: '🔓 Guía de SQL Injection - Login Vulnerable',
            description: 'Esta es una demostración educativa de SQL Injection',

            endpoints: {
                loginVulnerable: {
                    url: 'POST /api/v1/auth/login-low',
                    description: 'Login con verificación de contraseña (vulnerable)',
                },
                loginSimple: {
                    url: 'POST /api/v1/auth/login-low-simple',
                    description: 'Login sin verificación de contraseña',
                },
                search: {
                    url: 'POST /api/v1/auth/search-vulnerable',
                    description: 'Búsqueda de usuarios (vulnerable)',
                },
            },

            payloads: [
                {
                    name: 'Bypass básico',
                    identifier: "' OR '1'='1",
                    password: 'cualquier_cosa',
                    description: 'Hace que la condición WHERE siempre sea verdadera',
                },
                {
                    name: 'Comentario SQL (PostgreSQL)',
                    identifier: "admin@lab.com'--",
                    password: 'ignorado',
                    description: 'Comenta el resto de la consulta',
                },
                {
                    name: 'Comentario SQL alternativo',
                    identifier: "admin@lab.com'/*",
                    password: 'ignorado*/',
                    description: 'Comentario de bloque',
                },
                {
                    name: 'OR con cierre',
                    identifier: "' OR '1'='1' --",
                    password: 'x',
                    description: 'Con comentario al final',
                },
                {
                    name: 'Enumerar primer usuario',
                    identifier: "' OR '1'='1' LIMIT 1--",
                    password: 'x',
                    description: 'Obtiene solo el primer usuario',
                },
                {
                    name: 'Búsqueda de admin',
                    identifier: "' OR email LIKE '%admin%'--",
                    password: 'x',
                    description: 'Busca usuarios con "admin" en el email',
                },
            ],

            tools: [
                {
                    name: 'SQLMap',
                    command: 'sqlmap -u "http://localhost:3000/api/v1/auth/login-low" --data="identifier=test&password=test" --method=POST --dbms=PostgreSQL',
                    description: 'Herramienta automática de SQL Injection',
                },
                {
                    name: 'cURL',
                    command: `curl -X POST http://localhost:3000/api/v1/auth/login-low -H "Content-Type: application/json" -d '{"identifier": "\\' OR \\'1\\'=\\'1", "password": "test"}'`,
                    description: 'Prueba manual desde terminal',
                },
            ],

            warning: '⚠️ Este endpoint es solo para demostración educativa. No usar en sistemas reales.',
        };
    }
}
