import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// Mapa de rutas del aplicativo. Lo mantiene el lider del equipo: no agregar ni renombrar rutas sin acordarlo.
export default [
  route("login", "routes/login.tsx"),
  route("cambiar-contrasena", "routes/cambiar-contrasena.tsx"),
  // M4 / RNF13: politica de tratamiento de datos, publica.
  route("politica-de-datos", "routes/politica-de-datos.tsx"),

  layout("routes/app-layout.tsx", [
    index("routes/inicio.tsx"),

    // --- Modulo 1: clientes y usuarios
    route("clientes", "routes/clientes.lista.tsx"),
    route("clientes/nuevo", "routes/clientes.nuevo.tsx"),
    route("clientes/:clienteId/editar", "routes/clientes.editar.tsx"),
    route("clientes/:clienteId", "routes/clientes.detalle.tsx", [
      index("routes/clientes.detalle.ficha.tsx"),
      route("contactos", "routes/clientes.detalle.contactos.tsx"),
      route("redes", "routes/clientes.detalle.redes.tsx"),
    ]),
    route("usuarios", "routes/usuarios.lista.tsx"),
    route("usuarios/nuevo", "routes/usuarios.nuevo.tsx"),
    route("usuarios/:usuarioId", "routes/usuarios.editar.tsx"),
    route("perfil", "routes/perfil.tsx"),

    // --- Modulo 2: contenido y publicacion
    route("piezas", "routes/piezas.lista.tsx"),
    route("piezas/nueva", "routes/piezas.nueva.tsx"),
    route("piezas/:piezaId/editar", "routes/piezas.editar.tsx"),
    route("piezas/:piezaId", "routes/piezas.detalle.tsx"),
    route("cronograma", "routes/cronograma.tsx"),
    route("publicaciones", "routes/publicaciones.tsx"),
    route("envios", "routes/envios.tsx"),

    // --- Modulo 3: metricas y analitica
    route("metricas", "routes/metricas.tsx"),
    route("metricas/cargar", "routes/metricas.cargar.tsx"),

    // --- Modulo 4: notificaciones y trazabilidad
    route("alertas", "routes/alertas.tsx"),
    route("historial", "routes/historial.tsx"),
    route("cumplimiento", "routes/cumplimiento.tsx"),
    route("configuracion/politica", "routes/configuracion.politica.tsx"),
  ]),

  route("*", "routes/no-encontrado.tsx"),
] satisfies RouteConfig;
