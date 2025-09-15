// utils/sheetsClient.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!keyPath) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS in .env");
}

// Read credentials file
const credentials = JSON.parse(
  fs.readFileSync(path.resolve(keyPath), "utf8")
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

module.exports = sheets;
