function enc(text){
    return `=?utf-8?B?${Buffer.from(text).toString('base64')}?=`;
}

module.exports.resendEmail = function (data) {
    const subject = 'Your secret for GG';
    const message = [
        `From: GG APP <${data.fromEmail}>`,
        `To: ${enc(data.toName)} <${data.toEmail}>`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        `Subject: ${enc(subject)}`,
        '',
        `Hello ${data.toName}!`,
        '<br>',
        `You are given to the assessment system in the role <b>${data.toRole}</b>.`,
        '<br>',
        `Use this link <a href="${process.env.FRONT_ENDPOINT}/login?secret=${data.token}">${process.env.FRONT_ENDPOINT}/</a>`,
        `or use your email secret: <blockquote>${data.token}</blockquote>`        
    ].join('\n');

    return Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}