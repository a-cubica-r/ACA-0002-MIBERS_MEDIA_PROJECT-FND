import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub, RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { envioDePrueba } from "~/features/envios/fixtures";
import type { Envio, Role, Usuario } from "~/lib/api/types";
import { clearSession, setCachedUser, setTokens } from "~/lib/auth/session";
import AppLayout from "./app-layout";
import EnviosPage, { clientLoader } from "./envios";

const usuario = (role: Role): Usuario => ({
  id: "u1",
  username: "ana",
  first_name: "Ana",
  last_name: "Pérez",
  role,
  cargo: "",
  whatsapp_number: null,
  is_active: true,
  must_change_password: false,
  last_login: null,
  date_joined: "2026-01-01T00:00:00Z",
});
const fetchMock = vi.fn<typeof fetch>();
let envios: { count: number; results: Envio[] } | Response;

const page = <T,>(results: T[], count = results.length) =>
  Response.json({ count, next: null, previous: null, results });
const enviosCalls = () =>
  fetchMock.mock.calls
    .map(([url]) => new URL(String(url), "http://localhost"))
    .filter((url) => url.pathname === "/api/v1/envios");

function renderEnvios(path = "/envios") {
  const Stub = createRoutesStub([
    { path: "/envios", Component: EnviosPage as never, loader: clientLoader as never },
  ]);
  return render(<Stub initialEntries={[path]} />);
}

beforeEach(() => {
  setTokens({ access: "a", refresh: "r" });
  setCachedUser(usuario("STAFF"));
  envios = {
    count: 2,
    results: [
      envioDePrueba("ENTREGADO"),
      envioDePrueba("FALLIDO", { error: "Número sin WhatsApp." }),
    ],
  };
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    if (url.startsWith("/api/v1/clientes"))
      return page([
        { id: "c1", nombre: "Café La Montaña" },
        { id: "c2", nombre: "Panadería Sol" },
      ]);
    if (url.startsWith("/api/v1/envios"))
      return envios instanceof Response ? envios : page(envios.results, envios.count);
    return new Response(null, { status: 404 });
  });
});
afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
});

describe("/envios — registro de envíos al cliente", () => {
  it("muestra la tabla con todos los datos del envío", async () => {
    renderEnvios();
    const tabla = within(await screen.findByRole("table"));
    for (const header of [
      "Fecha",
      "Cliente",
      "Pieza",
      "Contacto",
      "Número",
      "Archivo",
      "Estado",
      "Enviado",
      "Entregado",
    ])
      expect(tabla.getByRole("columnheader", { name: header })).toBeInTheDocument();
    expect(tabla.getAllByRole("link", { name: "Lanzamiento de temporada" })[0]).toHaveAttribute(
      "href",
      "/piezas/p1",
    );
    expect(tabla.getAllByText("•••• 1234")).toHaveLength(2);
    expect(tabla.getAllByText("portada.jpg")).toHaveLength(2);
    expect(tabla.getByText("Entregado", { selector: "span" })).toBeInTheDocument();
    expect(tabla.getByText("Número sin WhatsApp.")).toBeInTheDocument();
    expect(screen.getByText("2 envíos")).toBeInTheDocument();
  });

  it("aplica los filtros de la URL y los conserva en el formulario", async () => {
    renderEnvios("/envios?cliente=c2&estado=FALLIDO&desde=2026-11-01&hasta=2026-11-30");
    await screen.findByRole("table");
    expect(Object.fromEntries(enviosCalls()[0].searchParams)).toEqual({
      cliente: "c2",
      estado: "FALLIDO",
      desde: "2026-11-01",
      hasta: "2026-11-30",
      page: "1",
      page_size: "25",
    });
    expect(screen.getByLabelText("Cliente")).toHaveValue("c2");
    expect(screen.getByLabelText("Estado")).toHaveValue("FALLIDO");
    expect(screen.getByLabelText("Desde")).toHaveValue("2026-11-01");
    expect(screen.getByLabelText("Hasta")).toHaveValue("2026-11-30");
  });

  it("filtra al enviar el formulario", async () => {
    const user = userEvent.setup();
    renderEnvios();
    await screen.findByRole("table");
    await user.selectOptions(screen.getByLabelText("Cliente"), "c1");
    await user.selectOptions(screen.getByLabelText("Estado"), "LEIDO");
    await user.click(screen.getByRole("button", { name: "Filtrar" }));
    await vi.waitFor(() => expect(enviosCalls()).toHaveLength(2));
    const query = enviosCalls()[1].searchParams;
    expect(query.get("cliente")).toBe("c1");
    expect(query.get("estado")).toBe("LEIDO");
    expect(query.has("desde")).toBe(false);
  });

  it("pagina conservando los filtros", async () => {
    envios = { count: 60, results: [envioDePrueba("ENVIADO")] };
    renderEnvios("/envios?estado=ENVIADO&page=2");
    await screen.findByRole("table");
    expect(enviosCalls()[0].searchParams.get("page")).toBe("2");
    expect(screen.getByText("Mostrando 26–50 de 60")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/envios?estado=ENVIADO&page=3",
    );
  });

  it("muestra el estado vacío", async () => {
    envios = { count: 0, results: [] };
    renderEnvios();
    expect(await screen.findByText("Sin envíos para estos filtros")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("muestra el error del servidor sin perder los filtros", async () => {
    envios = Response.json({ detail: "Servicio no disponible." }, { status: 503 });
    renderEnvios("/envios?estado=PENDIENTE");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo cargar el registro de envíos",
    );
    expect(screen.getByLabelText("Estado")).toHaveValue("PENDIENTE");
    expect(screen.getByRole("option", { name: "Café La Montaña" })).toBeInTheDocument();
  });
});

describe("/envios — permisos", () => {
  it("exige sesión", async () => {
    clearSession();
    const url = new URL("http://localhost/envios?estado=FALLIDO");
    const result = clientLoader({
      request: new Request(url),
      url,
      pattern: "/envios",
      params: {},
      context: new RouterContextProvider(),
    } as never);
    await expect(result).rejects.toSatisfy(
      (response: Response) =>
        response.headers.get("Location") === "/login?next=%2Fenvios%3Festado%3DFALLIDO",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each<Role>(["ADMIN", "STAFF"])("aparece en el menú para %s", async (role) => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: AppLayout as never,
        loader: () => ({ user: usuario(role) }),
        children: [{ index: true, Component: () => <p>Página de prueba</p> }],
      },
    ]);
    render(<Stub initialEntries={["/"]} />);
    await screen.findByText("Página de prueba");
    const nav = screen.getAllByRole("navigation")[0];
    expect(within(nav).getByRole("link", { name: "Envíos al cliente" })).toHaveAttribute(
      "href",
      "/envios",
    );
  });
});
