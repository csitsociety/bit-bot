const { google } = require('googleapis');
const sheets = google.sheets('v4');
const creds = require('./service_account_credentials.json');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getAuthToken() {
	const auth = new google.auth.GoogleAuth({
		scopes: SCOPES,
		keyFile: __dirname + '/service_account_credentials.json',
		projectId: creds.project_id
	});
	const authToken = await auth.getClient();
	return authToken;
}

async function getSpreadSheet({id, auth}) {
	const res = await sheets.spreadsheets.get({
		spreadsheetId: id,
		auth: auth,
	});
	return res;
}

async function getSpreadSheetValues({id, auth, sheetName}) {
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: id,
		auth: auth,
		range: sheetName
	});
	return res;
}

async function appendSpreadSheetValue({id, auth, sheetName, row}) {
	const res = await sheets.spreadsheets.values.append({
		spreadsheetId: id,
		auth: auth,
		range: sheetName,
		valueInputOption: 'RAW',
		insertDataOption: 'INSERT_ROWS',
		resource: {
			values: [
				[...row]
			]
		}
	});
	return res;
}


module.exports = {
	getAuthToken,
	getSpreadSheet,
	getSpreadSheetValues,
	appendSpreadSheetValue
}
