import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UsuarioCreateInput) {
    return this.prisma.usuario.create({ data });
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: Prisma.UsuarioUpdateInput) {
    return this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
      },
    });
  }

  async findAll(rol?: string) {
    const where: any = {};
    if (rol) {
      where.rol = rol;
    }

    return this.prisma.usuario.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleActivo(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: !usuario.activo },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });
  }

  async findByIdWithPassword(id: string) {
    return this.prisma.usuario.findUnique({
      where: { id },
    });
  }

  async updatePassword(id: string, hashedPassword: string) {
    return this.prisma.usuario.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
