import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function isCedulaEcuador(cedula: string): boolean {
  if (!/^[0-9]{10}$/.test(cedula)) return false;
  const prov = parseInt(cedula.substring(0, 2), 10);
  if (!((prov >= 1 && prov <= 24) || prov === 30)) return false; // 30: códigos especiales
  const d3 = parseInt(cedula[2], 10);
  if (d3 < 0 || d3 > 5) return false; // natural
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digits = cedula.split('').map((c) => parseInt(c, 10));
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let prod = digits[i] * coef[i];
    if (prod >= 10) prod -= 9;
    sum += prod;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === digits[9];
}

export function IsCedulaEcuador(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsCedulaEcuador',
      target: object.constructor,
      propertyName,
      options: { message: 'cédula inválida', ...validationOptions },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return typeof value === 'string' && isCedulaEcuador(value);
        },
      },
    });
  };
}

