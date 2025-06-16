const fs = require("fs");
const axios = require("axios");

const BASE_URL = "https://bakeyapp.com/auth/login";
const PASSWORD = "Aa1!TestUser";
const tokens = [];

async function loginUsers() {
  for (let i = 1; i <= 20; i++) {
    const email = `tester${i}@gmail.com`;

    try {
      const res = await axios.post(BASE_URL, {
        email,
        password: PASSWORD,
      });

      console.log(`✅ ${email} | Response:`, res.data);

      const token =
        res.data.accessToken || res.data.token || res.data.jwt || "NO_TOKEN";

      tokens.push({ email, accessToken: token });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.response?.data || err.message;
      console.log(`❌ ${email} | Error: ${errorMsg}`);

      tokens.push({ email, error: errorMsg });
    }
  }

  fs.writeFileSync("tokens.json", JSON.stringify(tokens, null, 2));
  console.log("🎯 Saved to tokens.json");
}

loginUsers();