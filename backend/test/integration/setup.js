// Tests de integración: usan la base de datos REAL definida en .env
import 'dotenv/config';

// SMTP dummy para que el envío de emails falle rápido (y sea ignorado) sin red externa
process.env.SMTP_HOST ||= 'localhost';
process.env.SMTP_USER ||= 'test';
process.env.SMTP_PASS ||= 'test';
