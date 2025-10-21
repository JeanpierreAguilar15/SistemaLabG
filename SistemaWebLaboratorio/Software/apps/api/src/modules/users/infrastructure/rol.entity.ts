import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioEntity } from './usuario.entity';

@Entity({ name: 'roles', schema: 'lab' })
export class RolEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre', unique: true })
  nombre: string;

  @Column({ name: 'descripcion', nullable: true })
  descripcion?: string;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @ManyToMany(() => UsuarioEntity, (u) => u.roles)
  usuarios: UsuarioEntity[];
}

