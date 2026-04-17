require("./setup");
const request = require("supertest");
const app = require("../app");
const Etudiant = require("../models/Etudiant");

describe("API /api/etudiants", () => {
  describe("POST /api/etudiants", () => {
    test("crée un nouvel étudiant (201)", async () => {
      const res = await request(app)
        .post("/api/etudiants")
        .send({
          nom: "Ben Hmida",
          prenom: "Alaa",
          email: "alaa@test.com",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.email).toBe("alaa@test.com");
    });

    test("renvoie 400 si un champ obligatoire manque", async () => {
      const res = await request(app)
        .post("/api/etudiants")
        .send({ nom: "Ben Hmida" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    test("renvoie 400 pour un email invalide", async () => {
      const res = await request(app)
        .post("/api/etudiants")
        .send({ nom: "X", prenom: "Y", email: "pas-un-email" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/etudiants", () => {
    test("retourne un tableau vide par défaut", async () => {
      const res = await request(app).get("/api/etudiants");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("retourne la liste des étudiants créés", async () => {
      await Etudiant.create({
        nom: "Dupont",
        prenom: "Jean",
        email: "jean@test.com",
      });

      const res = await request(app).get("/api/etudiants");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].nom).toBe("Dupont");
    });
  });

  describe("GET /api/etudiants/:id", () => {
    test("retourne l'étudiant avec moyenne et mention", async () => {
      const e = await Etudiant.create({
        nom: "Martin",
        prenom: "Leo",
        email: "leo@test.com",
        notes: [12, 14, 16],
      });

      const res = await request(app).get(`/api/etudiants/${e._id}`);
      expect(res.status).toBe(200);
      expect(res.body.moyenne).toBe(14);
      expect(res.body.mention).toBe("Bien");
      expect(res.body.admis).toBe(true);
    });

    test("retourne 404 si l'étudiant n'existe pas", async () => {
      const res = await request(app).get(
        "/api/etudiants/64b8a1b2c3d4e5f6a7b8c9d0"
      );
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/etudiants/:id/notes", () => {
    test("ajoute une note valide", async () => {
      const e = await Etudiant.create({
        nom: "X",
        prenom: "Y",
        email: "xy@test.com",
      });

      const res = await request(app)
        .put(`/api/etudiants/${e._id}/notes`)
        .send({ note: 15 });

      expect(res.status).toBe(200);
      expect(res.body.notes).toContain(15);
    });

    test("refuse une note hors intervalle (400)", async () => {
      const e = await Etudiant.create({
        nom: "A",
        prenom: "B",
        email: "ab@test.com",
      });

      const res = await request(app)
        .put(`/api/etudiants/${e._id}/notes`)
        .send({ note: 25 });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/etudiants/:id", () => {
    test("supprime un étudiant existant (204)", async () => {
      const e = await Etudiant.create({
        nom: "Z",
        prenom: "W",
        email: "zw@test.com",
      });

      const res = await request(app).delete(`/api/etudiants/${e._id}`);
      expect(res.status).toBe(204);

      const check = await Etudiant.findById(e._id);
      expect(check).toBeNull();
    });
  });
});
