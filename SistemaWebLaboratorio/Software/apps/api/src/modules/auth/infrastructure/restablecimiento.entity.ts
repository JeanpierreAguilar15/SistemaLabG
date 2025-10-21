import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioEntity } from '../../users/infrastructure/usuario.entity';

@Entity({ name: 'restablecimientos_contrasena', schema: 'lab' })
export class RestablecimientoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UsuarioEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: UsuarioEntity;

  @Column({ name: 'token' })
  token: string;

  @Column({ name: 'usado_en', type: 'timestamptz', nullable: true })
  usadoEn?: Date | null;

  @Column({ name: 'expira_en', type: 'timestamptz' })
  expiraEn: Date;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}

