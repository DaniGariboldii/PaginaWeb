import { Seo } from '../../components/ui/Seo';

const Section = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-lg font-semibold text-ink-900 mb-2">{title}</h2>
    <div className="text-sm text-ink-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export const TermsPage = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <Seo title="Términos y Condiciones" />
    <h1 className="text-3xl font-bold text-ink-900 mb-2">Términos y Condiciones</h1>
    <p className="text-sm text-ink-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-AR')}</p>

    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-8">
      <strong>Nota:</strong> completá los datos entre corchetes con la información real de tu empresa y hacé
      revisar este texto por un profesional legal antes de operar.
    </div>

    <Section title="1. Titularidad">
      <p>
        Este sitio es operado por <strong>[RAZÓN SOCIAL]</strong>, CUIT <strong>[CUIT]</strong>, con domicilio en
        <strong> [DOMICILIO]</strong>, Argentina (en adelante, “la Tienda”). El uso del sitio implica la aceptación
        de estos Términos y Condiciones.
      </p>
    </Section>

    <Section title="2. Productos y precios">
      <p>Los precios se expresan en pesos argentinos (ARS) e incluyen los impuestos vigentes, salvo aclaración.</p>
      <p>La Tienda puede modificar precios, productos y promociones en cualquier momento. El precio aplicable es el vigente al momento de confirmar la compra.</p>
      <p>Las imágenes son ilustrativas. La disponibilidad está sujeta a stock.</p>
    </Section>

    <Section title="3. Compra y pago">
      <p>Para comprar es necesario registrarse con datos veraces. El pago se procesa a través de <strong>Mercado Pago</strong>; la Tienda no almacena los datos de tu tarjeta.</p>
      <p>El pedido se confirma una vez acreditado el pago. Si el pago es rechazado, el pedido no se procesa.</p>
    </Section>

    <Section title="4. Envíos">
      <p>Los costos y plazos de envío se informan durante el checkout según la zona de entrega. Los plazos son estimados y pueden variar por causas ajenas a la Tienda.</p>
    </Section>

    <Section title="5. Derecho de arrepentimiento">
      <p>
        De acuerdo con la Ley 24.240 de Defensa del Consumidor y la Resolución 424/2020, podés arrepentirte de tu
        compra dentro de los <strong>10 días corridos</strong> desde la recepción del producto o la celebración del
        contrato, sin costo ni necesidad de justificación. Para ejercerlo, usá el{' '}
        <a href="/arrepentimiento" className="text-brand-600 hover:underline">Botón de Arrepentimiento</a>.
      </p>
    </Section>

    <Section title="6. Cambios y devoluciones">
      <p>Los productos pueden devolverse si presentan fallas o no se corresponden con lo solicitado, conforme la normativa vigente. Contactanos para gestionar el cambio o reintegro.</p>
    </Section>

    <Section title="7. Cuentas de usuario">
      <p>Sos responsable de mantener la confidencialidad de tu contraseña y de la actividad de tu cuenta. Notificá cualquier uso no autorizado.</p>
    </Section>

    <Section title="8. Propiedad intelectual">
      <p>Los contenidos del sitio (textos, imágenes, logos, software) pertenecen a la Tienda o a sus titulares y no pueden reproducirse sin autorización.</p>
    </Section>

    <Section title="9. Responsabilidad">
      <p>La Tienda no se responsabiliza por daños derivados del uso indebido del sitio o de causas de fuerza mayor. Se garantiza el cumplimiento de las obligaciones conforme a la legislación vigente.</p>
    </Section>

    <Section title="10. Ley aplicable y jurisdicción">
      <p>Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier conflicto, se aplican las normas de defensa del consumidor y los tribunales competentes del domicilio del consumidor.</p>
    </Section>

    <Section title="11. Contacto">
      <p>Por consultas escribinos desde la página de <a href="/contacto" className="text-brand-600 hover:underline">Contacto</a>.</p>
    </Section>
  </div>
);
