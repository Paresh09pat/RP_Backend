const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3001; // Change this if needed

const spreadsheetId = "1fo8ocTrURciR2jEVWs2cU8LdIwoaxguRWl2tSopZw_g"; // Replace with your Google Sheets ID

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.post("/subscribe", (req, res) => {
  const { email } = req.body;

  // Check if email already exists
  isEmailExist(email)
    .then((exists) => {
      if (exists) {
        res.status(400).json({ error: "Email already exists." });
      } else {
        writeToSheet(email)
          .then(() => {
            res
              .status(200)
              .json({ message: "Successfully subscribed to the newsletter!" });
          })
          .catch((error) => {
            console.error("Error:", error);
            res
              .status(500)
              .json({ error: "An error occurred. Please try again later." });
          });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    });
});

// Function to check if email exists in Google Sheets
async function isEmailExist(email) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json", // Replace with your API credentials file name
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1", // Replace with your sheet name
  });

  const values = response.data.values;

  if (values && values.length) {
    return values.some((row) => row[0] === email);
  }

  return false;
}

// Function to write email to Google Sheets
async function writeToSheet(email) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json", // Replace with your API credentials file name
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const currentDate = new Date().toString();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1", // Replace with your sheet name
    valueInputOption: "USER_ENTERED",
    resource: { values: [[email, currentDate]] },
  });
}




app.post('/submit-form', async (req, res) => {
  const { fullName, email, query } = req.body;

  const spreadsheetId = '1qpIRgFZe8LB3pmA055He7w15OJWX1kU2Jm_xYtT5omk'; // Replace with the ID of your Google Sheets file
  const credentials = require('./credentials.json'); // Replace with the path to your credentials JSON file

  // Set up Google Sheets API client
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );


  try {
    // Authorize the client to access Google Sheets API
    await auth.authorize();
    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare the data to be inserted into the Google Sheet
    const values = [[fullName, email, query, new Date().toString()]];

    // Append the data to the Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1', // Replace 'Sheet1' with the name of your sheet
      valueInputOption: 'RAW',
      resource: { values },
    });

    res.json({ success: true, message: 'Form data stored in Google Sheets successfully.' });
  } catch (error) {
    console.error('Error storing data in Google Sheets:', error);
    res.status(500).json({ success: false, message: 'Failed to store data in Google Sheets.' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
