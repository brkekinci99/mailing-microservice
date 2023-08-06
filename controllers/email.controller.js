const db = require('../models');
const Email = db.emails;
const Op = db.Sequelize.Op;

exports.create = async (params) => {
	if (!params.subject || !params.name || !params.email || !params.message || !params.send_to) {
		console.log('Contents can not be empty');
		return;
	}

	try {
		const data = await Email.create(params, { raw: true });
		return data;
	} catch (error) {
		console.log(error);
	}
};

exports.findOne = (params, res) => {};

exports.update = (params, status) => {
	Email.update(
		{ status: status },
		{
			where: { id: params.id },
		}
	)
		.then()
		.catch((err) => {
			console.log(err);
		});
};

exports.delete = (params, res) => {};

exports.deleteAll = (params, res) => {};

exports.findAll = async () => {
	const data = await Email.findAll({ raw: true, order: [['createdAt', 'DESC']] });
	let dateFormat = new Intl.DateTimeFormat('tr-TR');
	const newData = data.map((element) => {
		return {
			...element,
			date: dateFormat.format(element.createdAt),
			message: element.message.length > 25 ? element.message.substring(0, 25) + '...' : element.message,
		};
	});
	return newData;
};
