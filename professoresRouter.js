const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const router = express.Router();
router.use(cors()); // libera todas as rotas para acesso por origens diferentes

const knex = require("./dbConfig");

router.get("/", async (req, res) => {
  try {
    const professores = await knex("professores").orderBy("id", "desc"); // .select() é opcional
    res.status(200).json(professores);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

// envio de imagem com configurações avançadas
const storage = multer.diskStorage({
  destination: (req, file, callback) =>
    callback(null, path.resolve(__dirname, "fotos")),
  filename: (req, file, callback) =>
    callback(null, Date.now() + "-" + file.originalname),
});

const fs = require("fs");

const upload2 = multer({ storage });

// rota com envio de imagem do vinho
router.post("/", upload2.single("foto"), async (req, res) => {
  // informações que podem ser obtidas do arquivo enviado
  console.log(req.file.originalname);
  console.log(req.file.filename);
  console.log(req.file.mimetype);
  console.log(req.file.size);

  const { nome, curso, salario} = req.body;
  const foto = req.file.path; // obtém o caminho do arquivo no server

  if (!nome || !curso || !salario || !foto) {
    res.status(400).json({ msg: "Informe nome, curso, salario e foto do vinho" });
    return;
  }

  if (
    (req.file.mimetype != "image/jpeg" && req.file.mimetype != "image/png") ||
    req.file.size > 512 * 1024
  ) {
    fs.unlinkSync(foto); // exclui o arquivo do servidor
    res
      .status(400)
      .json({ msg: "Formato inválido da imagem ou imagem muito grande" });
    return;
  }

  try {
    const novo = await knex("professores").insert({ nome, curso, salario, foto });
    res.status(201).json({ id: novo[0] });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  // para exclusão do registro com id informado
  const id = req.params.id; // ou: const { id } = req.params
  try {
    await knex("professores").del().where({ id }); // ou: .where('id', id)
    res.status(200).json();
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.put("/:id", async (req, res) => {
  // para alteração do registro com id informado
  const id = req.params.id; // ou: const { id } = req.params
  const { salario } = req.body;
  try {
    await knex("professores").update({ salario }).where({ id }); // ou: .where('id', id)
    res.status(200).json();
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.get("/pesq/:palavra", async (req, res) => {
  const { palavra } = req.params;
  try {
    const professores = await knex("professores")
      .where("nome", "like", `%${palavra}%`)
      .orWhere("curso", "like", `%${palavra}%`);
    res.status(200).json(professores);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.get("/salario/:inicial/:final?", async (req, res) => {
  const { inicial, final } = req.params;
  try {
    let professores;
    if (final) {
      professores = await knex("professores").whereBetween("salario", [inicial, final]);
    } else {
      professores = await knex("professores").where("salario", ">=", inicial);
    }
    res.status(200).json(professores);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.get("/total", async (req, res) => {
  try {
    const consulta = await knex("professores")
      .count({ num: "*" })
      .sum({ total: "salario" })
      .min({ menor: "salario" })
      .max({ maior: "salario" })
      .avg({ media: "salario" });
    // desestruturação do objeto retornado em consulta[0] (json)
    const { num, total, menor, maior, media } = consulta[0];
    res.status(200).json({ num, total, menor, maior, media: Number(media).toFixed(2) });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

module.exports = router;
