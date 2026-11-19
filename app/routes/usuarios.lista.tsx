import { Form, Link, useSubmit } from "react-router";
import type { Route } from "./+types/usuarios.lista";
import { requireAdmin } from "~/lib/auth/guards";
import { listUsuarios } from "~/lib/api/usuarios";
import { fullName, ROLE_LABEL, formatDateTime } from "~/lib/format";
import type { Usuario } from "~/lib/api/types";
import { UsuarioActions, mutateUsuario } from "~/features/usuarios/usuario-actions";
import { Badge } from "~/components/ui/badge";
import { buttonClasses } from "~/components/ui/button";
import { Card, CardBody } from "~/components/ui/card";
import { Field } from "~/components/ui/field";
import { Select } from "~/components/ui/select";
import { PageHeader } from "~/components/ui/page-header";
import { EmptyState } from "~/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "~/components/ui/table";

export const meta: Route.MetaFunction = () => [{ title: "Usuarios · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAdmin(request);
  const estado = new URL(request.url).searchParams.get("estado") ?? "activos";
  const users = await listUsuarios({
    isActive: estado === "todos" ? undefined : estado !== "inactivos",
  });
  return { user, users, estado };
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const id = form.get("usuarioId");
  if (typeof id !== "string" || !id) return { ok: false, error: "Selecciona un usuario válido." };
  return mutateUsuario(form.get("intent"), id);
}
function Status({ user }: { user: Usuario }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge tone={user.is_active ? "success" : "neutral"}>
        {user.is_active ? "Activo" : "Inactivo"}
      </Badge>
      {user.must_change_password && <Badge tone="warning">Contraseña temporal</Badge>}
    </div>
  );
}
export default function UsuariosLista({ loaderData }: Route.ComponentProps) {
  const { user, users, estado } = loaderData;
  const submit = useSubmit();
  const lastLogin = (item: Usuario) =>
    item.last_login ? formatDateTime(item.last_login) : "Aún no ha ingresado";
  const actions = (item: Usuario) => (
    <div className="space-y-2">
      <Link
        to={`/usuarios/${item.id}`}
        className={buttonClasses({ variant: "secondary", size: "sm" })}
      >
        Editar<span className="sr-only"> a {item.username}</span>
      </Link>
      <UsuarioActions user={item} currentUserId={user.id} />
    </div>
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Administra el equipo y sus permisos de acceso."
        actions={
          <Link to="/usuarios/nuevo" className={buttonClasses()}>
            Nuevo usuario
          </Link>
        }
      />
      <Form method="get" className="max-w-xs" onChange={(event) => submit(event.currentTarget)}>
        <Field label="Estado" htmlFor="estado">
          <Select id="estado" name="estado" defaultValue={estado} key={estado}>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Todos</option>
          </Select>
        </Field>
        <noscript>
          <button type="submit">Filtrar</button>
        </noscript>
      </Form>
      {users.length === 0 ? (
        <EmptyState
          title="No hay usuarios en este estado"
          description="Prueba con otro filtro o crea un nuevo usuario."
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <THead>
                <TR>
                  <TH>Nombre / usuario</TH>
                  <TH>Rol / cargo</TH>
                  <TH>Estado</TH>
                  <TH>Último ingreso</TH>
                  <TH>Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {users.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <p className="font-medium">{fullName(item)}</p>
                      <p className="text-ink-muted">{item.username}</p>
                    </TD>
                    <TD>
                      <Badge tone="brand">{ROLE_LABEL[item.role]}</Badge>
                      <p className="mt-1">{item.cargo || "Sin cargo"}</p>
                    </TD>
                    <TD>
                      <Status user={item} />
                    </TD>
                    <TD>{lastLogin(item)}</TD>
                    <TD>{actions(item)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
          <div className="grid gap-4 md:hidden">
            {users.map((item) => (
              <Card key={item.id}>
                <CardBody>
                  <div className="mb-4 space-y-2">
                    <h2 className="text-ink font-semibold break-words">{fullName(item)}</h2>
                    <p className="text-ink-muted text-sm break-all">{item.username}</p>
                    <Badge tone="brand">{ROLE_LABEL[item.role]}</Badge>
                    <p className="text-ink-muted text-sm">{item.cargo || "Sin cargo"}</p>
                    <Status user={item} />
                    <p className="text-ink-muted text-xs">Último ingreso: {lastLogin(item)}</p>
                  </div>
                  {actions(item)}
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
