# Módulo 5 — Supervisión del Equipo de Trabajo

Estado: **vacío**. El 22/11/2026 se retiraron todas sus pantallas por estar **fuera del alcance del Acta 3**. Este
módulo no tiene funciones en el aplicativo.

## Qué se retiró

| Función                                  | Pantalla             | HU / RF      |
| ---------------------------------------- | -------------------- | ------------ |
| Tareas del equipo                        | `/tareas`            | HU-22 / RF21 |
| Panel de supervisión                     | `/equipo`            | HU-23 / RF22 |
| Portal del cliente (vista previa, de M1) | `/portal/:clienteId` | HU-27 / RF25 |

Con ellas se eliminaron `features/tareas/`, `lib/api/tareas.ts`, el almacén simulado `lib/mock/` (que guardaba datos de
la aplicación en `localStorage`) y su contrato `docs/api-mock.md`. Desde entonces el frontend no guarda datos de la
aplicación en el navegador: todo viene de la API Django.

Las rutas retiradas llevan a la página "no encontrado".
