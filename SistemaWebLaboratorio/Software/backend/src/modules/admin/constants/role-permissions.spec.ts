import { getAllRoleLevels, getPermissionsForRole, isValidRoleName } from './role-permissions';

describe('role-permissions', () => {
  it('exposes only the three business roles', () => {
    expect(getAllRoleLevels().map((role) => role.nombre)).toEqual([
      'Administrador',
      'Personal_Laboratorio',
      'Paciente',
    ]);
  });

  it('assigns validation and result upload to Personal_Laboratorio', () => {
    const permissions = getPermissionsForRole('Personal_Laboratorio');

    expect(permissions?.permisos).toEqual(
      expect.arrayContaining([
        'Subir PDFs de resultados',
        'Validar resultados',
      ]),
    );
  });

  it('does not allow inventory permissions for Personal_Laboratorio', () => {
    const permissions = getPermissionsForRole('Personal_Laboratorio');

    expect(permissions?.permisos.join(' ')).not.toMatch(/inventario|reactivos|stock/i);
  });

  it('validates canonical role names', () => {
    expect(isValidRoleName('Administrador')).toBe(true);
    expect(isValidRoleName('Personal_Laboratorio')).toBe(true);
    expect(isValidRoleName('Paciente')).toBe(true);
    expect(isValidRoleName('Recepcion')).toBe(false);
  });
});
