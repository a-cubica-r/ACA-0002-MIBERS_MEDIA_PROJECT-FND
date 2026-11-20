import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Modal } from "./modal";

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  });
});

afterAll(() => {
  HTMLDialogElement.prototype.showModal = originalShowModal;
  HTMLDialogElement.prototype.close = originalClose;
});

describe("Modal", () => {
  it("muestra el título cuando open es true", () => {
    render(
      <Modal open onClose={() => {}} title="Editar cliente">
        Contenido del modal
      </Modal>,
    );

    expect(screen.getByText("Editar cliente")).toBeInTheDocument();
    expect(screen.getByText("Contenido del modal")).toBeInTheDocument();
  });

  it("llama onClose al cerrar con el botón Cerrar", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Editar cliente">
        Contenido del modal
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
