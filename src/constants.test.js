import { validarCedula, validarTelefono, CEDULA_LONGITUD } from "./constants";

describe("validarCedula", () => {
  it("acepta una cédula con formato XXX-XXXXXXX-X", () => {
    expect(validarCedula("001-1234567-8")).toBe(true);
  });

  it("acepta 11 dígitos sin guiones (los guiones son opcionales)", () => {
    expect(validarCedula("00112345678")).toBe(true);
  });

  it("rechaza cadenas con menos de 11 dígitos", () => {
    expect(validarCedula("0011234567")).toBe(false);
    expect(validarCedula("123")).toBe(false);
  });

  it("rechaza la cadena vacía", () => {
    expect(validarCedula("")).toBe(false);
  });

  it("rechaza cédulas con letras", () => {
    expect(validarCedula("abc-1234567-8")).toBe(false);
  });

  it("la longitud esperada de la cédula es 11", () => {
    expect(CEDULA_LONGITUD).toBe(11);
  });
});

describe("validarTelefono", () => {
  it("acepta la cadena vacía (campo opcional)", () => {
    expect(validarTelefono("")).toBe(true);
  });

  it("acepta un teléfono con dígitos y guiones", () => {
    expect(validarTelefono("809-555-1234")).toBe(true);
  });

  it("acepta 7 dígitos seguidos (mínimo permitido)", () => {
    expect(validarTelefono("1234567")).toBe(true);
  });

  it("rechaza menos de 7 caracteres", () => {
    expect(validarTelefono("123")).toBe(false);
  });

  it("rechaza valores con letras", () => {
    expect(validarTelefono("abc1234")).toBe(false);
  });
});
