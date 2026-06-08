import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, resetPasswordSchema } from '../src/validators/auth.validator.js';
import { addItemSchema, updateItemSchema } from '../src/validators/cart.validator.js';

describe('registerSchema', () => {
  const valid = { firstName: 'Juan', lastName: 'Perez', email: 'JUAN@test.com', password: 'Segura123' };

  it('acepta datos válidos y normaliza el email a minúsculas', () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed.email).toBe('juan@test.com');
  });

  it('rechaza contraseña sin mayúscula', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'segura123' })).toThrow();
  });

  it('rechaza contraseña sin número', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'SeguraPass' })).toThrow();
  });

  it('rechaza contraseña corta', () => {
    expect(() => registerSchema.parse({ ...valid, password: 'Ab1' })).toThrow();
  });

  it('rechaza email inválido', () => {
    expect(() => registerSchema.parse({ ...valid, email: 'no-es-email' })).toThrow();
  });
});

describe('loginSchema', () => {
  it('requiere email y password', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com' })).toThrow();
  });
});

describe('resetPasswordSchema', () => {
  it('exige token y contraseña fuerte', () => {
    expect(() => resetPasswordSchema.parse({ token: 't', password: 'Valida123' })).not.toThrow();
    expect(() => resetPasswordSchema.parse({ token: '', password: 'Valida123' })).toThrow();
    expect(() => resetPasswordSchema.parse({ token: 't', password: 'debil' })).toThrow();
  });
});

describe('cart validators', () => {
  it('addItem: quantity por defecto 1 y productId uuid', () => {
    const parsed = addItemSchema.parse({ productId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(parsed.quantity).toBe(1);
  });

  it('addItem: rechaza productId no-uuid', () => {
    expect(() => addItemSchema.parse({ productId: '123' })).toThrow();
  });

  it('updateItem: rechaza cantidad cero o negativa', () => {
    expect(() => updateItemSchema.parse({ quantity: 0 })).toThrow();
    expect(() => updateItemSchema.parse({ quantity: -2 })).toThrow();
  });
});
