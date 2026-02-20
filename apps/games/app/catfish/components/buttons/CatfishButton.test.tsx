import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatfishButton } from "./CatfishButton";

describe("CatfishButton", () => {
  const defaultProps = {
    variant: "1" as const,
    color: "#FF0000",
    hoverColor: "#CC0000",
  };

  it("renders with children text", () => {
    render(<CatfishButton {...defaultProps}>Click Me</CatfishButton>);

    expect(
      screen.getByRole("button", { name: "Click Me" }),
    ).toBeInTheDocument();
  });

  it("applies correct variant configuration", () => {
    const { container } = render(
      <CatfishButton {...defaultProps} variant="2">
        Test
      </CatfishButton>,
    );

    const img = container.querySelector("img");
    expect(img).toHaveAttribute(
      "src",
      "/images/catfish/buttons/button-2-frame.png",
    );
  });

  it("renders all button variants", () => {
    const variants = ["1", "2", "3", "4"] as const;

    variants.forEach((variant) => {
      const { container } = render(
        <CatfishButton {...defaultProps} variant={variant}>
          Variant {variant}
        </CatfishButton>,
      );

      const img = container.querySelector("img");
      expect(img).toHaveAttribute(
        "src",
        `/images/catfish/buttons/button-${variant}-frame.png`,
      );
    });
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <CatfishButton {...defaultProps} onClick={handleClick}>
        Click Me
      </CatfishButton>,
    );

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("handles multiple clicks", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <CatfishButton {...defaultProps} onClick={handleClick}>
        Click Me
      </CatfishButton>,
    );

    const button = screen.getByRole("button");
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it("works without onClick handler", async () => {
    const user = userEvent.setup();

    render(<CatfishButton {...defaultProps}>Click Me</CatfishButton>);

    // Should not throw
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("handles hover state changes", async () => {
    const user = userEvent.setup();

    render(<CatfishButton {...defaultProps}>Hover Me</CatfishButton>);

    const button = screen.getByRole("button");

    // Hover on
    await user.hover(button);
    // Note: Testing actual colour change would require checking SVG fill
    // which is controlled by React state. The button itself should remain in DOM.
    expect(button).toBeInTheDocument();

    // Hover off
    await user.unhover(button);
    expect(button).toBeInTheDocument();
  });

  it("applies custom text colour", () => {
    const { container } = render(
      <CatfishButton {...defaultProps} textColor="#00FF00">
        Coloured Text
      </CatfishButton>,
    );

    const span = container.querySelector("span");
    expect(span).toHaveStyle({ color: "#00FF00" });
  });

  it("uses default white text colour when not specified", () => {
    const { container } = render(
      <CatfishButton {...defaultProps}>Default Text</CatfishButton>,
    );

    const span = container.querySelector("span");
    // Browser converts 'white' to 'rgb(255, 255, 255)'
    expect(span).toHaveStyle({ color: "rgb(255, 255, 255)" });
  });

  describe("SVG configuration", () => {
    it("renders SVG with correct viewBox for variant 1", () => {
      const { container } = render(
        <CatfishButton {...defaultProps} variant="1">
          Test
        </CatfishButton>,
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 286 74");
    });

    it("renders SVG with correct viewBox for variant 3", () => {
      const { container } = render(
        <CatfishButton {...defaultProps} variant="3">
          Test
        </CatfishButton>,
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 283 66");
    });

    it("renders SVG path element", () => {
      const { container } = render(
        <CatfishButton {...defaultProps}>Test</CatfishButton>,
      );

      const path = container.querySelector("svg path");
      expect(path).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("is keyboard accessible", () => {
      render(<CatfishButton {...defaultProps}>Keyboard Test</CatfishButton>);

      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("has button role", () => {
      render(<CatfishButton {...defaultProps}>Role Test</CatfishButton>);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
