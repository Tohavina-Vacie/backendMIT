require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  emailValide,
  motDePasseValide,
  MESSAGE_EMAIL,
  MESSAGE_MOT_DE_PASSE,
} = require("../utils/validation");

const args = process.argv.slice(2);
const reinitialiser = args.includes("--reset-mdp");
const [
  email,
  motDePasse,
  role = "admin",
  prenom = "Principal",
  nom = "Admin",
] = args.filter((a) => !a.startsWith("--"));

const creerAdmin = async () => {
  if (!email || !motDePasse) {
    console.log(
      "Usage : node src/scripts/createAdmin.js email motdepasse [admin|super_admin] [prenom] [nom] [--reset-mdp]",
    );
    process.exit(1);
  }

  if (!["admin", "super_admin"].includes(role)) {
    console.log("Le rôle doit être admin ou super_admin");
    process.exit(1);
  }

  // Mêmes règles que l'inscription sur le site
  if (!emailValide(email)) {
    console.log(MESSAGE_EMAIL);
    process.exit(1);
  }
  if (!motDePasseValide(motDePasse)) {
    console.log(MESSAGE_MOT_DE_PASSE);
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existe = await User.findOne({ email: email.toLowerCase() });
    if (existe) {
      existe.role = role;
      existe.statut = "actif";
      if (reinitialiser) {
        existe.mot_de_passe = await bcrypt.hash(motDePasse, 10);
      }
      await existe.save();
      console.log(
        `Compte existant passé au rôle ${role}${
          reinitialiser ? " (mot de passe réinitialisé)" : ""
        }`,
      );
      process.exit(0);
    }

    const hash = await bcrypt.hash(motDePasse, 10);

    await User.create({
      nom,
      prenom,
      email: email.toLowerCase(),
      mot_de_passe: hash,
      role,
    });

    console.log(`${role} créé avec succès (${email.toLowerCase()})`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

creerAdmin();
