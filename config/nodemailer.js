const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
        user: 'uriel82@ethereal.email',
        pass: '2knhhK4aBXpHtu579e'
    }
});

transporter.verify((error, success) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Le serveur est prêt à prendre en charge les messages !');
    }
});

module.exports = transporter;