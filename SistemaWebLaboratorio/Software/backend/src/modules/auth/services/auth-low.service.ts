/**
 * ===============================================================
 * AUTH-LOW SERVICE - VULNERABLE - SOLO PARA DEMOSTRACION
 * ===============================================================
 *
 * Servicio con metodos vulnerables a SQL Injection.
 * Similar a DVWA (Damn Vulnerable Web Application).
 *
 * NO USAR EN PRODUCCION
 * ELIMINAR DESPUES DEL INFORME
 * ===============================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthLowService {
    private readonly logger = new Logger(AuthLowService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    /**
     * Login VULNERABLE a SQL Injection
     * Construye la query concatenando strings directamente
     */
    async loginVulnerable(identifier: string, password: string) {
        this.logger.warn(`[VULNERABLE] Intento de login con: ${identifier}`);

        // Query VULNERABLE - concatenacion directa de strings
        const vulnerableQuery = `
            SELECT * FROM usuarios."Usuario"
            WHERE (email = '${identifier}' OR cedula = '${identifier}')
            AND contrasena_hash = '${password}'
        `;

        this.logger.warn(`[VULNERABLE] Query ejecutada: ${vulnerableQuery}`);

        try {
            // Ejecutar query vulnerable
            const result = await this.prisma.$queryRawUnsafe(vulnerableQuery);

            if (Array.isArray(result) && result.length > 0) {
                const user = result[0] as any;

                // Generar token para el usuario encontrado
                const payload = {
                    sub: user.codigo_usuario,
                    email: user.email,
                    rol: user.rol,
                };

                const accessToken = this.jwtService.sign(payload);

                return {
                    success: true,
                    message: 'Login exitoso mediante SQL Injection',
                    user: {
                        codigo_usuario: user.codigo_usuario,
                        email: user.email,
                        nombres: user.nombres,
                        apellidos: user.apellidos,
                        rol: user.rol,
                    },
                    access_token: accessToken,
                    queryExecuted: vulnerableQuery,
                    vulnerabilityExploited: 'SQL Injection - Authentication Bypass',
                };
            }

            return {
                success: false,
                message: 'Credenciales invalidas',
                queryExecuted: vulnerableQuery,
            };

        } catch (error) {
            this.logger.error(`[VULNERABLE] Error en query: ${error.message}`);
            return {
                success: false,
                message: 'Error en la consulta SQL',
                error: error.message,
                queryExecuted: vulnerableQuery,
            };
        }
    }

    /**
     * Login SUPER VULNERABLE - sin verificacion de contrasena
     */
    async loginVulnerableSimple(identifier: string) {
        this.logger.warn(`[VULNERABLE-SIMPLE] Intento con: ${identifier}`);

        const vulnerableQuery = `
            SELECT * FROM usuarios."Usuario"
            WHERE email = '${identifier}' OR cedula = '${identifier}'
            LIMIT 1
        `;

        this.logger.warn(`[VULNERABLE-SIMPLE] Query: ${vulnerableQuery}`);

        try {
            const result = await this.prisma.$queryRawUnsafe(vulnerableQuery);

            if (Array.isArray(result) && result.length > 0) {
                const user = result[0] as any;

                const payload = {
                    sub: user.codigo_usuario,
                    email: user.email,
                    rol: user.rol,
                };

                const accessToken = this.jwtService.sign(payload);

                return {
                    success: true,
                    message: 'Login exitoso SIN verificar contrasena',
                    user: {
                        codigo_usuario: user.codigo_usuario,
                        email: user.email,
                        nombres: user.nombres,
                        apellidos: user.apellidos,
                        rol: user.rol,
                    },
                    access_token: accessToken,
                    queryExecuted: vulnerableQuery,
                };
            }

            return {
                success: false,
                message: 'Usuario no encontrado',
                queryExecuted: vulnerableQuery,
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error en la consulta',
                error: error.message,
                queryExecuted: vulnerableQuery,
            };
        }
    }

    /**
     * Extraccion de todos los usuarios - VULNERABLE
     */
    async extractAllUsers(payload: string) {
        this.logger.warn(`[VULNERABLE-EXTRACT] Payload: ${payload}`);

        const vulnerableQuery = `
            SELECT codigo_usuario, email, nombres, apellidos, cedula, rol
            FROM usuarios."Usuario"
            WHERE nombres LIKE '%${payload}%'
            OR apellidos LIKE '%${payload}%'
            OR email LIKE '%${payload}%'
        `;

        this.logger.warn(`[VULNERABLE-EXTRACT] Query: ${vulnerableQuery}`);

        try {
            const result = await this.prisma.$queryRawUnsafe(vulnerableQuery);

            return {
                success: true,
                message: `Se encontraron ${Array.isArray(result) ? result.length : 0} usuarios`,
                data: result,
                queryExecuted: vulnerableQuery,
                vulnerabilityExploited: 'SQL Injection - Data Extraction',
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error en la consulta',
                error: error.message,
                queryExecuted: vulnerableQuery,
            };
        }
    }

    /**
     * Informacion sobre la vulnerabilidad para el informe
     */
    getVulnerabilityInfo() {
        return {
            title: 'SQL Injection - CWE-89',
            description: 'Neutralizacion incorrecta de elementos especiales usados en comandos SQL',
            severity: 'CRITICA',
            cvssScore: 9.8,

            affectedEndpoints: [
                'POST /api/v1/auth/login-low',
                'POST /api/v1/auth/login-low-simple',
                'POST /api/v1/auth/search-vulnerable',
            ],

            rootCause: 'Concatenacion directa de entrada del usuario en queries SQL sin sanitizacion ni uso de consultas preparadas',

            codeExample: {
                vulnerable: `
                    // VULNERABLE - NO HACER ESTO
                    const query = "SELECT * FROM usuarios WHERE email = '" + userInput + "'";
                    await prisma.$queryRawUnsafe(query);
                `,
                secure: `
                    // SEGURO - Usar parametros
                    const user = await prisma.usuario.findFirst({
                        where: { email: userInput }
                    });
                `,
            },

            impact: [
                'Bypass de autenticacion',
                'Acceso no autorizado a datos',
                'Modificacion o eliminacion de datos',
                'Ejecucion de comandos en el servidor',
            ],

            mitigation: [
                'Usar consultas preparadas (Prisma ORM)',
                'Validar y sanitizar toda entrada del usuario',
                'Aplicar principio de minimo privilegio en BD',
                'Implementar WAF (Web Application Firewall)',
            ],

            references: [
                'https://owasp.org/www-community/attacks/SQL_Injection',
                'https://cwe.mitre.org/data/definitions/89.html',
                'https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access',
            ],
        };
    }
}
