const {
  calculerMoyenne,
  getMention,
  estAdmis,
} = require("../utils/calculNote");

describe("calculerMoyenne", () => {
  test("retourne 0 pour un tableau vide", () => {
    expect(calculerMoyenne([])).toBe(0);
  });

  test("calcule correctement la moyenne d'un tableau de notes", () => {
    expect(calculerMoyenne([10, 12, 14])).toBe(12);
  });

  test("arrondit à 2 décimales", () => {
    expect(calculerMoyenne([10, 11, 13])).toBeCloseTo(11.33, 2);
  });

  test("accepte une seule note", () => {
    expect(calculerMoyenne([15])).toBe(15);
  });

  test("lève une erreur si l'argument n'est pas un tableau", () => {
    expect(() => calculerMoyenne("notes")).toThrow(TypeError);
  });

  test("lève une erreur si une note n'est pas un nombre", () => {
    expect(() => calculerMoyenne([10, "12", 14])).toThrow(TypeError);
  });

  test("lève une erreur si une note est hors de 0-20", () => {
    expect(() => calculerMoyenne([10, 21, 14])).toThrow(RangeError);
    expect(() => calculerMoyenne([-1, 10])).toThrow(RangeError);
  });
});

describe("getMention", () => {
  test('"Insuffisant" pour < 10', () => {
    expect(getMention(9.99)).toBe("Insuffisant");
    expect(getMention(0)).toBe("Insuffisant");
  });
  test('"Passable" pour 10 <= m < 12', () => {
    expect(getMention(10)).toBe("Passable");
    expect(getMention(11.99)).toBe("Passable");
  });
  test('"Assez bien" pour 12 <= m < 14', () => {
    expect(getMention(12)).toBe("Assez bien");
    expect(getMention(13.99)).toBe("Assez bien");
  });
  test('"Bien" pour 14 <= m < 16', () => {
    expect(getMention(14)).toBe("Bien");
    expect(getMention(15.99)).toBe("Bien");
  });
  test('"Très bien" pour >= 16', () => {
    expect(getMention(16)).toBe("Très bien");
    expect(getMention(20)).toBe("Très bien");
  });
  test("lève une erreur si hors 0-20", () => {
    expect(() => getMention(-1)).toThrow(RangeError);
    expect(() => getMention(21)).toThrow(RangeError);
  });
});

describe("estAdmis", () => {
  test("true si moyenne >= 10", () => {
    expect(estAdmis(10)).toBe(true);
    expect(estAdmis(15)).toBe(true);
  });
  test("false si moyenne < 10", () => {
    expect(estAdmis(9.99)).toBe(false);
    expect(estAdmis(0)).toBe(false);
  });
});
