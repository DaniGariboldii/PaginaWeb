// Variables de entorno mínimas para que los módulos que leen env no fallen al importarse.
// No se conecta a ninguna base de datos real (las pruebas son de lógica pura).
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET ||= 'test_access_secret_para_pruebas_unitarias_xx';
process.env.JWT_REFRESH_SECRET ||= 'test_refresh_secret_para_pruebas_unitarias_x';
process.env.MP_WEBHOOK_SECRET ||= 'test_webhook_secret';
process.env.NODE_ENV = 'test';
