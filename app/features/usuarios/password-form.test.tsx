import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub, useActionData } from "react-router";
import { describe, expect, it } from "vitest";
import { parseForm } from "~/lib/validation";
import { PasswordForm } from "./password-form";
import { passwordSchema } from "./schemas";
import type { FormResult } from "./action-feedback";

function TestPage() {
  return <PasswordForm result={useActionData<FormResult>()} />;
}
describe("formulario de cambio de contraseña", () => {
  it("muestra el error de coincidencia, asocia el campo y lleva el foco al error", async () => {
    const user = userEvent.setup();
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: TestPage,
        action: async ({ request }) => {
          const parsed = parseForm(passwordSchema, await request.formData());
          return parsed.success ? { ok: true } : { ok: false, fieldErrors: parsed.fieldErrors };
        },
      },
    ]);
    render(<Stub />);
    await user.type(screen.getByLabelText("Contraseña actual", { exact: false }), "Temporal.2026");
    await user.type(screen.getByLabelText(/^Nueva contraseña/), "Nueva.Segura2026");
    await user.type(
      screen.getByLabelText("Confirmar nueva contraseña", { exact: false }),
      "Distinta.Segura2026",
    );
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nueva contraseña", { exact: false })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText("Revisa los campos marcados.").closest("[tabindex]")).toHaveFocus();
  });
});
