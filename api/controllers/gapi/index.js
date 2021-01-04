'use strict';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '【クライアントID】';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '【クライアントシークレット】';
const GOOGLE_REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || 'https://【サーバのホスト名】/googleapisample/signin.html';
const GOOGLE_SCOPE = ['https://www.googleapis.com/auth/drive.metadata.readonly',
											'https://www.googleapis.com/auth/photoslibrary.readonly',
											'https://www.googleapis.com/auth/gmail.readonly',
											'https://www.googleapis.com/auth/calendar.readonly'];

const HELPER_BASE = process.env.HELPER_BASE || '../../helpers/';
const Response = require(HELPER_BASE + 'response');
const Redirect = require(HELPER_BASE + 'redirect');

const { URL, URLSearchParams } = require('url');
const fetch = require('node-fetch');
const Headers = fetch.Headers;

const {google} = require('googleapis');

exports.handler = async (event, context, callback) => {
	var body = JSON.parse(event.body);
	console.log(body);

	if( event.path == '/gapi/authorize' ){
		var params = {
			scope: GOOGLE_SCOPE,
			access_type: 'offline'
		};
		if( event.queryStringParameters.state )
			params.state = event.queryStringParameters.state;
		if( event.queryStringParameters.prompt )
			params.prompt = 'consent';
		const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL);
		var url = auth.generateAuthUrl(params);
		return new Redirect(url);
	}else
	if( event.path == '/gapi/token'){
		try{
			const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL);
			var token = await auth.getToken(body.code);
			console.log(token);
			auth.setCredentials(token.tokens);

			const drive = google.drive({version: 'v3', auth: auth});
			var drive_list = await drive.files.list({
				pageSize: 10,
				fields: 'nextPageToken, files(id, name)',
			});
			var image_list = await do_get_image_list({ pageSize: 100 }, token.tokens.access_token);

			const calendar = google.calendar({version: 'v3', auth});
			var calendar_list = await calendar.events.list({
				calendarId: 'primary',
				maxResults: 10,
				singleEvents: true,
				orderBy: 'updated'
			});

			const gmail = google.gmail({version: 'v1', auth});
			var mail_list = await gmail.users.labels.list({
				userId: 'me',
			});

			return new Response({ drive_list, image_list, calendar_list, mail_list });
		}catch(error){
			throw error;
		}
	}
};

function do_get_image_list(qs, token) {
	const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Authorization": "Bearer " + token });
	var params = new URLSearchParams(qs);
	var url2 = new URL("https://photoslibrary.googleapis.com/v1/mediaItems");
	url2.search = params;

	return fetch(url2.toString(), {
			method: 'GET',
			headers: headers
		})
		.then((response) => {
			if (!response.ok)
				throw 'status is not 200';
			return response.json();
		});
}

function do_post_image_data(image_body, image_type, token) {
	const headers = new Headers({ 'Content-Type': 'application/octet-stream', 'X-Goog-Upload-Content-Type': image_type, "X-Goog-Upload-Protocol": "raw", "Authorization": "Bearer " + token });

	return fetch("https://photoslibrary.googleapis.com/v1/uploads", {
			method: 'POST',
			body: new Uint8Array(image_body),
			headers: headers,
	})
	.then((response) => {
			if (!response.ok)
					throw 'status is not 200';
			return response.text();
	});
}

function do_post_image_item(body, token) {
	const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Authorization": "Bearer " + token });

	return fetch("https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate", {
			method: 'POST',
			body: JSON.stringify(body),
			headers: headers
		})
		.then((response) => {
			if (!response.ok)
				throw 'status is not 200';
			return response.json();
		});
}