export const metadata = { title: "Ayuda | Admin" };

const SECTIONS = [
  { id: "materias-primas", label: "Materias primas" },
  { id: "proveedores", label: "Proveedores" },
  { id: "importar-lista", label: "Importar lista de precios" },
  { id: "vincular-precio", label: "Vincular precio a materia prima" },
  { id: "recetas", label: "Recetas" },
  { id: "pedidos", label: "Pedidos" },
  { id: "stock", label: "Stock" },
  { id: "produccion", label: "Producción" },
];

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="text-sm text-foreground/80 leading-relaxed">{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 leading-relaxed">
      <span className="font-semibold">Nota: </span>{children}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 leading-relaxed">
      <span className="font-semibold">Tip: </span>{children}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="font-heading text-xl text-foreground mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function AyudaPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-foreground">Ayuda</h1>
        <p className="text-muted-foreground mt-1">
          Guía de los procesos principales del sistema.
        </p>
      </div>

      <div className="flex gap-10 items-start">
        {/* Table of contents — desktop only */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Contenido</p>
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 space-y-12 min-w-0">

          {/* ── MATERIAS PRIMAS ── */}
          <Section id="materias-primas" title="Alta de materia prima">
            <p className="text-sm text-muted-foreground mb-4">
              Las materias primas son todos los insumos del sistema: ingredientes crudos, intermedios (elaboraciones propias) y productos terminados para la venta.
            </p>
            <Step n={1}>Ir a <strong>Materias Primas</strong> en el menú lateral.</Step>
            <Step n={2}>Hacer clic en <strong>Nueva materia prima</strong>.</Step>
            <Step n={3}>
              Elegir el <strong>Tipo</strong>:
              <br />• <em>Materia prima</em> — ingrediente que comprás (harina, chocolate, huevos).
              <br />• <em>Intermedio</em> — preparación propia que usás como ingrediente en otras recetas (ganache, mermelada casera). Podés vincularle una receta.
              <br />• <em>Producto terminado</em> — lo que vendés (torta, caja de alfajores). Tiene precio de venta.
            </Step>
            <Step n={4}>Completar nombre, categoría, unidad de medida y precio de costo actual.</Step>
            <Step n={5}>Si es <strong>Producto terminado</strong>, completar también el <strong>Precio de venta</strong>. Este precio se autocompleta al agregar el producto a un pedido.</Step>
            <Step n={6}>Si es <strong>Intermedio</strong>, podés vincularle una receta para que el sistema calcule su costo automáticamente al cambiar precios de ingredientes.</Step>
            <Tip>
              Podés filtrar por tipo (Ingrediente / Intermedio / Producto terminado) y por categoría usando los filtros arriba de la tabla. El buscador también funciona por nombre.
            </Tip>
          </Section>

          {/* ── PROVEEDORES ── */}
          <Section id="proveedores" title="Alta de proveedor">
            <Step n={1}>Ir a <strong>Proveedores</strong> en el menú lateral.</Step>
            <Step n={2}>Hacer clic en <strong>Nuevo proveedor</strong>.</Step>
            <Step n={3}>Completar nombre, teléfono, email y dirección (todos opcionales salvo el nombre).</Step>
            <Step n={4}>
              Elegir el <strong>Formato de lista</strong> si el proveedor tiene importación automática de PDF:
              <br />• <em>CEPRO</em> — lista CEPRO Rosario.
              <br />• <em>Drovandi</em> — lista Drovandi.
              <br />• <em>Lodiser</em> — lista Lodiser.
              <br />• <em>PIRA</em> — lista PIRA.
              <br />Si no tiene formato automático, dejarlo vacío e ingresarás los precios a mano.
            </Step>
            <Step n={5}>
              Elegir la <strong>Tasa de IVA</strong>:
              <br />• <em>0%</em> — la lista ya es precio final (sin IVA separado).
              <br />• <em>10.5%</em> o <em>21%</em> — el sistema calcula el precio neto a partir del precio final (o viceversa, según el proveedor).
            </Step>
          </Section>

          {/* ── IMPORTAR LISTA ── */}
          <Section id="importar-lista" title="Importar lista de precios (PDF)">
            <p className="text-sm text-muted-foreground mb-4">
              Solo disponible para proveedores con formato de lista configurado (CEPRO, Drovandi, Lodiser, PIRA).
            </p>
            <Step n={1}>Ir a <strong>Proveedores</strong> → hacer clic en <strong>Ver catálogo</strong> del proveedor.</Step>
            <Step n={2}>Hacer clic en <strong>Importar lista</strong> (botón arriba a la derecha).</Step>
            <Step n={3}>Seleccionar el archivo PDF de la lista de precios y elegir la fecha de vigencia.</Step>
            <Step n={4}>Hacer clic en <strong>Extraer precios</strong>. El sistema analiza el PDF y muestra una tabla de productos encontrados.</Step>
            <Step n={5}>Revisar los precios. Podés editar cualquier precio directamente en la tabla antes de importar, o deseleccionar filas que no querés importar.</Step>
            <Step n={6}>Hacer clic en <strong>Importar</strong>. Los precios quedan guardados en el catálogo del proveedor.</Step>
            <Note>
              Los precios importados <em>no se aplican automáticamente</em> a las materias primas. Primero quedan en el catálogo del proveedor; después vos elegís cuál aplicar a cada materia prima (ver siguiente sección).
            </Note>
          </Section>

          {/* ── VINCULAR PRECIO ── */}
          <Section id="vincular-precio" title="Vincular precio de proveedor a materia prima">
            <p className="text-sm text-muted-foreground mb-4">
              Una vez importada la lista, asociás cada producto del catálogo con la materia prima correspondiente y aplicás el precio.
            </p>
            <Step n={1}>Ir a <strong>Materias Primas</strong> → hacer clic en la fila del insumo para expandirlo.</Step>
            <Step n={2}>En la sección <strong>Proveedor activo</strong>, aparecen las ofertas disponibles de todos los proveedores que tienen ese producto en su catálogo.</Step>
            <Step n={3}>Hacer clic en <strong>Aplicar precio</strong> sobre la oferta que querés usar. El precio de costo de la materia prima se actualiza y queda registrado en el historial.</Step>
            <Tip>
              Si la materia prima aún no aparece en el catálogo de ningún proveedor, podés ir al catálogo del proveedor y vincular el producto manualmente desde ahí, usando la columna "Vincular materia prima".
            </Tip>
          </Section>

          {/* ── RECETAS ── */}
          <Section id="recetas" title="Carga de recetas">
            <Step n={1}>Ir a <strong>Recetas</strong> en el menú lateral.</Step>
            <Step n={2}>Hacer clic en <strong>Nueva receta</strong>.</Step>
            <Step n={3}>Completar nombre, categoría, dificultad y <strong>rendimiento</strong> (cuántas unidades produce: ej. "24 unidades", "1 torta", "500 g").</Step>
            <Step n={4}>En la sección <strong>Ingredientes</strong>, buscar y agregar cada materia prima con su cantidad y unidad.</Step>
            <Step n={5}>El <strong>costo total</strong> y el <strong>costo por unidad</strong> se calculan automáticamente según los precios actuales de cada ingrediente.</Step>
            <Step n={6}>El <strong>Precio sugerido</strong> es el costo por unidad multiplicado por el factor de venta (configurable en <strong>Configuración</strong>). Este precio se autocompleta cuando agregás la receta a un pedido.</Step>
            <Note>
              Si una materia prima no tiene precio de costo cargado, su contribución al costo de la receta será $0. Asegurate de tener precios actualizados en todas las materias primas que uses.
            </Note>
            <Tip>
              Los intermedios (ganache, rellenos, etc.) también son materias primas. Podés vincularles una receta en Materias Primas → editar → "Receta vinculada", y el costo del intermedio se actualizará automáticamente cuando cambien sus ingredientes.
            </Tip>
          </Section>

          {/* ── PEDIDOS ── */}
          <Section id="pedidos" title="Carga y gestión de pedidos">
            <Step n={1}>Ir a <strong>Pedidos</strong> → hacer clic en <strong>Nuevo pedido</strong>.</Step>
            <Step n={2}>Seleccionar o crear el <strong>cliente</strong>. Completar fecha de evento y fecha de entrega.</Step>
            <Step n={3}>
              En la sección <strong>Ítems del pedido</strong>, seleccionar una <strong>Receta</strong> o <strong>Producto terminado</strong> del selector:
              <br />• <em>Recetas</em>: el precio sugerido se completa automáticamente (editalo si cobrás diferente).
              <br />• <em>Productos terminados</em>: trae el precio de venta configurado en Materias Primas.
            </Step>
            <Step n={4}>Agregar la <strong>personalización</strong> si aplica (ej. "Feliz cumpleaños María").</Step>
            <Step n={5}>Avanzar el estado del pedido según la etapa: <em>Borrador → Presupuestado → Confirmado → En producción → Listo → Entregado → Pagado</em>.</Step>
            <Step n={6}>En la sección <strong>Pago</strong>, registrar cuándo cobraste la seña y el saldo.</Step>
            <Note>
              Al marcar un pedido como <strong>Entregado</strong>, el sistema descuenta automáticamente el stock de los productos terminados que tengan materia prima vinculada. Las recetas puras no descuentan stock hasta que implementemos esa funcionalidad.
            </Note>
            <Tip>
              Podés ver los pedidos en vista <strong>Lista</strong> (tabla con estado y totales) o vista <strong>Calendario</strong> (por fecha de entrega). Usá el calendario para planificar la semana.
            </Tip>
          </Section>

          {/* ── STOCK ── */}
          <Section id="stock" title="Gestión de stock">
            <p className="text-sm text-muted-foreground mb-4">
              El stock refleja la cantidad disponible de cada materia prima. Se actualiza manualmente mediante movimientos o automáticamente al entregar pedidos.
            </p>
            <Step n={1}>Ir a <strong>Stock</strong> en el menú lateral para ver el nivel actual de todos los insumos.</Step>
            <Step n={2}>Las filas en <strong>rojo</strong> indican insumos con stock en cero o negativo. Las filas en <strong>amarillo</strong> indican stock bajo (definido en la configuración de cada materia prima).</Step>
            <Step n={3}>Para registrar una <strong>compra</strong>, expandir la materia prima y usar el formulario de movimiento con razón "Compra" y la cantidad recibida.</Step>
            <Step n={4}>Para <strong>ajustar</strong> el stock (corrección de inventario), usar razón "Ajuste" con cantidad positiva o negativa.</Step>
            <Step n={5}>Los movimientos de <strong>Venta</strong> se registran solos cuando un pedido pasa a "Entregado".</Step>
            <Step n={6}>El historial de movimientos muestra todas las entradas y salidas con fecha, razón y saldo resultante.</Step>
          </Section>

          {/* ── PRODUCCIÓN ── */}
          <Section id="produccion" title="Planificación de producción">
            <p className="text-sm text-muted-foreground mb-4">
              La página de Producción consolida todos los pedidos activos del período y calcula qué preparar y cuántos ingredientes necesitás.
            </p>
            <Step n={1}>Ir a <strong>Producción</strong> en el menú lateral.</Step>
            <Step n={2}>Seleccionar el período usando los botones rápidos (<em>Esta semana</em>, <em>Próximos 14 días</em>, <em>Este mes</em>) o ingresar fechas manualmente.</Step>
            <Step n={3}>El panel <strong>Qué preparar</strong> muestra cada receta con la cantidad total a producir, desglosada por pedido y cliente.</Step>
            <Step n={4}>El panel <strong>Materias primas necesarias</strong> suma todos los ingredientes de todas las recetas del período, escalados a la cantidad a producir. Muestra también el stock disponible para que veas qué te falta comprar.</Step>
            <Note>
              Solo aparecen pedidos en estado <em>Presupuestado, Confirmado, En producción</em> o <em>Listo</em>. Los borradores y pedidos ya entregados/cancelados no se incluyen.
            </Note>
            <Note>
              Para que la producción pueda calcular ingredientes, cada ítem del pedido debe estar vinculado a una <strong>Receta</strong>. Si el ítem fue cargado como texto libre sin receta asociada, no aparecerá en el desglose de ingredientes.
            </Note>
          </Section>

        </div>
      </div>
    </div>
  );
}
