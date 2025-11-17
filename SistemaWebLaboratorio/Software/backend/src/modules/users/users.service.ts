import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(codigo_usuario: number) {
    return this.prisma.usuario.findUnique({
      where: { codigo_usuario },
      include: { rol: true, perfil_medico: true },
    });
  }

  async findByCedula(cedula: string) {
    return this.prisma.usuario.findUnique({
      where: { cedula },
      include: { rol: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });
  }
}
