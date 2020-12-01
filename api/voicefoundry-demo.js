'use strict';

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

const s3 = new AWS.S3();

/**
 * uploadFile
 * @description Handler for uploading file data from the client to an S3 bucket
 * @function
 * @param {!Object} event - AWS lambda event
 */
module.exports.uploadFile = async (event) => {
	let statusCode = 200;
	let message = 'File uploaded successfully';

	// Make sure the file being uploaded has the proper information
	const uploadedFile = event.body ? JSON.parse(event.body) : event;
	if (!uploadedFile.fileName || !uploadedFile.fileContent) {
		statusCode = 400;
		message = 'File information was not complete';
	}

	// Make sure the file is a txt file
	else if (!uploadedFile.fileName.toLowerCase().endsWith('.txt')) {
		statusCode = 400;
		message = 'File is not a text file';
	}

	// Make sure the file is not too large - I chose 350 KB to keep it from getting too big for DynamoDB
	else if (uploadedFile.fileContent.length > 358400) {
		statusCode = 400;
		message = 'File must be smaller than 350 KB';
	}

	// If we passed all the tests, store the file into S3
	else {
		// Assemble the object that we'll be storing in S3
		const Key = `${uuidv4()}/${uploadedFile.fileName}`;
		const Body = Buffer.from(uploadedFile.fileContent, 'base64');
		const s3Object = {
			Key,
			Body,
			Bucket: 'voicefoundry-demo-bucket',
		};

		// Put the object into S3 and get a handle to the result
		const s3result = await new Promise((resolve) => {
			s3.putObject(s3Object, function (err, result) {
				if (err) resolve(err);
				if (result) resolve(result);
			});
		});
		statusCode = _.get(s3result, 'statusCode', statusCode);
		message = _.get(s3result, 'code', message);
	}

	// Return the proper status of the operation
	return {
		statusCode,
		body: JSON.stringify({
			message,
		}),
	};
};

/**
 * parseFile
 * @description Reads a file from S3 and stores it in DynamoDB
 * @function
 * @param {!Object} event - AWS lambda event
 */
module.exports.parseFile = async (event) => {
	let success = true;

	// Get the file out of S3
	const Key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
	const Bucket = event.Records[0].s3.bucket.name;
	const s3Params = { Bucket, Key };
	const file = await s3.getObject(s3Params).promise();

	// To save them separately in Dynamo, break the S3 key into uuid and fileName
	const uuid = Key.split('/')[0];
	const fileName = Key.substring(Key.indexOf('/') + 1);

	// Store the content of the document in DynamoDB
	const dynamoParams = {
		TableName: 'voicefoundry-demo-table',
		Item: {
			uuid: { S: uuid },
			fileName: { S: fileName },
			content: { S: file.Body.toString('utf-8') },
		},
	};
	const dynamoDB = new AWS.DynamoDB();
	await dynamoDB
		.putItem(dynamoParams, function (err) {
			if (err) {
				console.log('Dynamo Error', err);
				success = false;
			}
		})
		.promise();

	return success;
};
