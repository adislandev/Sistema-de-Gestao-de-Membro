const argon2 = require('argon2');

// IMPORTANTE: Defina aqui a senha que você quer gerar o hash
// Para o Passo 7 (Staging Admin): Coloque a senha desejada para o admin de pré-produção
const passwordToHash = 'sua_senha_staging_aqui'; // <- TROQUE AQUI!

async function generateArgon2Hash() {
  console.log(`Gerando hash Argon2 para a senha: "${passwordToHash}"`);
  try {
    // Certifique-se que argon2 está instalado: npm install argon2
    const hash = await argon2.hash(passwordToHash);
    console.log("\n--- Hash Argon2 Gerado ---");
    console.log(hash); // Copie toda esta linha de hash para o seu seed.sql
    console.log("--------------------------\n");
  } catch (err) {
    console.error("\nERRO ao gerar hash Argon2:", err);
  }
}

generateArgon2Hash();
