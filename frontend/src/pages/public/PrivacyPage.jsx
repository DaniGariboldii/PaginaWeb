import { Seo } from '../../components/ui/Seo';

const Section = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-lg font-semibold text-ink-900 mb-2">{title}</h2>
    <div className="text-sm text-ink-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export const PrivacyPage = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <Seo title="Política de Privacidad" />
    <h1 className="text-3xl font-bold text-ink-900 mb-2">Política de Privacidad</h1>
    <p className="text-sm text-ink-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-AR')}</p>

    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-8">
      <strong>Nota:</strong> completá los datos de tu empresa y hacé revisar este texto por un profesional legal.
    </div>

    <Section title="1. Responsable de los datos">
      <p>
        Los datos personales que nos brindás son tratados por <strong>[RAZÓN SOCIAL]</strong>, CUIT <strong>[CUIT]</strong>,
        conforme a la Ley 25.326 de Protección de Datos Personales.
      </p>
    </Section>

    <Section title="2. Qué datos recopilamos">
      <p>Datos de registro (nombre, email, teléfono), direcciones de envío, historial de pedidos y datos de navegación. Los datos de pago son procesados por Mercado Pago; no los almacenamos.</p>
    </Section>

    <Section title="3. Para qué los usamos">
      <p>Para procesar tus compras y envíos, brindarte soporte, enviarte información sobre tus pedidos y mejorar el servicio. No vendemos tus datos a terceros.</p>
    </Section>

    <Section title="4. Con quién los compartimos">
      <p>Solo con proveedores necesarios para operar (procesador de pagos, servicio de envíos, proveedor de emails), quienes tratan los datos según sus propias políticas y la normativa aplicable.</p>
    </Section>

    <Section title="5. Seguridad">
      <p>Aplicamos medidas técnicas y organizativas para proteger tus datos (contraseñas cifradas, conexiones seguras, control de accesos).</p>
    </Section>

    <Section title="6. Tus derechos">
      <p>
        Podés acceder, rectificar, actualizar o suprimir tus datos personales en cualquier momento escribiéndonos
        desde la página de <a href="/contacto" className="text-brand-600 hover:underline">Contacto</a>. El titular de
        los datos tiene la facultad de ejercer el derecho de acceso en forma gratuita a intervalos no inferiores a
        seis meses (art. 14, inc. 3, Ley 25.326).
      </p>
      <p>
        La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, órgano de control de la Ley 25.326, tiene la atribución de
        atender denuncias y reclamos relacionados con el incumplimiento de las normas sobre protección de datos
        personales.
      </p>
    </Section>

    <Section title="7. Cookies">
      <p>Usamos cookies propias y de terceros para mantener tu sesión y mejorar la experiencia. Podés configurarlas desde tu navegador.</p>
    </Section>

    <Section title="8. Cambios">
      <p>Podemos actualizar esta política. Publicaremos los cambios en esta misma página con su fecha de actualización.</p>
    </Section>
  </div>
);
