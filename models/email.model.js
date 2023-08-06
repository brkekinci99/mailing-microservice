module.exports = (sequelize, Sequelize) => {
	const Email = sequelize.define('email', {
		subject: {
			type: Sequelize.STRING,
		},
		name: {
			type: Sequelize.STRING,
		},
		email: {
			type: Sequelize.STRING,
		},
		message: {
			type: Sequelize.STRING,
		},
		send_to: {
			type: Sequelize.STRING,
		},
		status: {
			type: Sequelize.STRING,
			defaultValue: 'Pending',
		},
		file: {
			type: Sequelize.TEXT,
		},
		client_info: {
			type: Sequelize.TEXT,
		},
	});
	return Email;
};
