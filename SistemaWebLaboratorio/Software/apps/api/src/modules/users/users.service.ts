import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from './infrastructure/usuario.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuariosRepo: Repository<UsuarioEntity>,
  ) {}

  async listar() {
    const usuarios = await this.usuariosRepo.find();
    return usuarios.map((u) => ({
      id: u.id,
      correo: u.correo,
      nombre: u.nombre,
      apellido: u.apellido,
      activo: u.activo,
      roles: (u.roles || []).map((r) => r.nombre),
    }));
  }
}

