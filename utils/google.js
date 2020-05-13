const google = require('googleapis').google;

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI,
);

module.exports.authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
        "email", "profile", "openid",
        'https://www.googleapis.com/auth/gmail.send',
    ].join(' ')
});

module.exports.getUser = async function (code) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });

    const userinfo = await oauth2.userinfo.get();
    return {
        email: userinfo.data.email,
        name: userinfo.data.name,
        role: 'admin',
        extAttr: {
            picture: userinfo.data.picture
        },
        google: {
            id: userinfo.data.id,
            tokens: tokens
        }
    };
}

module.exports.sendEmail = async function (from, message) {
    oauth2Client.setCredentials(from.google.tokens);
    const gmail = google.gmail({ auth: oauth2Client, version: 'v1' });
    return gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: message,
        },
    });
};