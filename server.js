const express = require('express');
const basicAuth = require('express-basic-auth');
const { body, validationResult } = require('express-validator');
const expressHbs = require('express-handlebars');
const hbs = require('nodemailer-express-handlebars');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();
const multer = require('multer');
const db = require('./models');
const emails = require('./controllers/email.controller');

db.sequelize
	.sync({})
	.then(() => {
		console.log('Synced db.');
	})
	.catch((err) => {
		console.log(`Failed to sync db: ${err.message}`);
	});

const storage = multer.diskStorage({
	destination(req, file, cb) {
		cb(null, './uploads');
	},
	filename(req, file, cb) {
		// Rename File
		const extensionArray = file.mimetype.split('/');
		const extension = extensionArray[extensionArray.length - 1];
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`; // UUID
		cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
	},
});

const upload = multer({ storage }).array('file');

const transporter = nodemailer.createTransport({
	service: 'Outlook365',
	auth: {
		user: process.env.EMAIL_SENDER,
		pass: process.env.EMAIL_PASS,
	},
});

const MAIL_TEMPLATE = 'email_template';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const options = {
	viewEngine: {
		extname: '.handlebars',
		partialsDir: path.resolve('./views/'),
		layoutsDir: path.resolve('./views/'),
		defaultLayout: false,
	},
	viewPath: path.resolve('./views/'),
	extname: '.handlebars',
};

transporter.use('compile', hbs(options));

const app = express();

app.use(express.static('uploads'));

app.engine(
	'handlebars',
	expressHbs.engine({
		layoutsDir: `${__dirname}/views/`,
	})
);
app.set('view engine', 'handlebars');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const authOptions = {
	users: {
		saportif: process.env.ADMIN_PASS,
	},
	challenge: true,
};

app.get('/', basicAuth(authOptions), (req, res) => {
	res.render('email_form', {
		layout: 'email_form',
	});
});

app.get('/emails', basicAuth(authOptions), async (req, res) => {
	const emailsList = await emails.findAll();

	res.render('emails', {
		layout: 'emails',
		emails: emailsList,
	});
});

app.post(
	'/',
	upload,
	body('email').isEmail().normalizeEmail(),
	body('subject').notEmpty(),
	body('name').notEmpty(),
	body('message').notEmpty(),
	body('sendTo').notEmpty().isEmail().normalizeEmail(),
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const mail = {
			subject: req.body.subject,
			name: req.body.name,
			email: req.body.email,
			message: req.body.message,
			send_to: req.body.sendTo,
			client_info: req.body.clientInfo || '',
			file: 'no files sent',
			status: 'pending',
		};

		if (req.files?.length) {
			mail.file = req.files[0].filename;
			for (let i = 1; i < req.files.length; i++) {
				mail.file += `,${req.files[i].filename}`;
			}
		}

		const mailOptions = {
			from: `${mail.email} <support@saportif.com>`,
			to: mail.send_to,
			bcc: 'dogukan@saportif.com',
			subject: mail.subject,
			template: `${MAIL_TEMPLATE}`,
			context: {
				mailSubject: mail.subject,
				message: mail.message + '<br><br><br><hr>' + mail.client_info,
			},
		};

		const attachments = [];

		if (req.files?.length) {
			for (let i = 0; i < req.files.length; i++) {
				attachments[i] = {
					filename: req.files[i].filename,
					path: `${APP_URL}/${req.files[i].filename}`,
				};
			}
			mailOptions.attachments = attachments;
		}

		const entry = await emails.create(mail);

		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				emails.update(entry, 'failed');
				res.status(400).send(`An error occurred. ${error}`);

				return console.log(error);
			}
			emails.update(entry, 'successfull');

			console.log(`Message sent: ${info.response}`);
		});

		res.send('Successfully sent.');
	}
);

const version = process.env.VERSION || '2.0';
const port = process.env.PORT || '3000';
app.listen(port, () => {
	console.log(`Version: ${version}`);
	console.log(`Server started on port ${port}`);
	console.log(`http://localhost:${port}/`);
});
