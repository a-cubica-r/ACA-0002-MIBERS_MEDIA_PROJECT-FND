import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, buttonClasses } from "./button";

describe("Button", () => {
  it("renderiza el texto", () => {
    render(<Button>Guardar cliente</Button>);

    expect(screen.getByRole("button", { name: "Guardar cliente" })).toBeInTheDocument();
  });

  it("se deshabilita mientras loading está activo", () => {
    render(<Button loading>Guardar cliente</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("buttonClasses para danger incluye el fondo de peligro", () => {
    expect(buttonClasses({ variant: "danger" })).toContain("bg-danger-600");
  });
});
