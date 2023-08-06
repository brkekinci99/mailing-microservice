require('dotenv').config();

module.exports = {
	HOST: process.env.DATABASE_HOST,
	PORT: process.env.DATABASE_PORT,
	NAME: process.env.DATABASE_NAME,
	USERNAME: process.env.DATABASE_USER,
	PASSWORD: process.env.DATABASE_PASS,
	DIALECT: 'mysql',
};
