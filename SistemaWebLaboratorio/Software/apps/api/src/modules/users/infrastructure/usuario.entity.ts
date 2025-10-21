import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolEntity } from './rol.entity';

@Entity({ name: 'usuarios', schema: 'lab' })
export class UsuarioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'correo', unique: true, length: 150 })
  correo: string;

  @Column({ name: 'hash_contrasena' })
  hashContrasena: string;

  @Column({ name: 'nombre', nullable: true })
  nombre?: string;

  @Column({ name: 'apellido', nullable: true })
  apellido?: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento?: string;

  @Column({ name: 'telefono', nullable: true })
  telefono?: string;

  @Column({ name: 'cedula', unique: true, nullable: true })
  cedula?: string;

  @Column({ name: 'activo', default: true })
  activo: boolean;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @Column({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn: Date;

  @ManyToMany(() => RolEntity, (rol) => rol.usuarios, { eager: true })
  @JoinTable({
    name: 'usuario_roles',
    schema: 'lab',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles: RolEntity[];
}
