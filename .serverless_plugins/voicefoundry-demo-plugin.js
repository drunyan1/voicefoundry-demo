'use strict';

const AWS = require('aws-sdk');
const fs = require('fs');
const _ = require('lodash');

/**
 * @class VoiceFoundryDemo
 * @classdesc Invoke a lambda immediately after it is deployed
 */
class VoiceFoundryDemo {
	/**
	 * @description Initialize commands and hooks
	 * @constructor
	 * @param {!Object} serverless - Serverless object
	 * @param {!Object} options - Serverless options
	 */
	constructor(serverless, options) {
		this.serverless = serverless;
		this.options = options;

		this.commands = {
			intialize: {
				usage: 'Uploads an initial file to the voicefoundry-demo-bucket',
				lifecycleEvents: ['readfile', 'callservice'],
			},
		};

		this.hooks = {
			'deploy:deploy': this.readFile.bind(this),
			'after:deploy:deploy': this.callService.bind(this),
		};
	}

	/**
	 * @description Load the contents of the initialization file
	 * @function
	 */
	readFile() {
		// Get the file name out of the serverless config (default to initial.txt if it wasn't passed in)
		const fileName = _.get(this.serverless, 'service.custom.voicefoundrydemo.file', 'initial.txt');

		// Load the contents of the file and convert them to base 64
		const fileContent = fs.readFileSync(`./${fileName}`).toString('base64');

		// Set the file information in the serverless variables so we can access it in the next step
		this.serverless.variables.file = { fileName, fileContent };
	}

	/**
	 * @description Invoke the lambda to upload the initialization file
	 * @function
	 */
	callService() {
		// Set up the AWS lambda object
		AWS.config.update({ region: this.options.region });
		const lambda = new AWS.Lambda();
		const serverless = this.serverless;

		// Set up the payload for the lambda call, using options that were passed from the serverless config
		const service = _.get(serverless, 'service.custom.voicefoundrydemo.service', 'voicefoundry-demo');
		const stage = _.get(serverless, 'service.custom.voicefoundrydemo.stage', 'dev');
		const lambdaName = _.get(serverless, 'service.custom.voicefoundrydemo.lambda', 'voicefoundry-demo-upload');
		const lambdaParams = {
			FunctionName: `${service}-${stage}-${lambdaName}`,
			Payload: JSON.stringify(serverless.variables.file),
		};

		// Invoke the lambda and test for success
		lambda.invoke(lambdaParams, function (err, data) {
			if (err) {
				console.log('ERR', err);
				serverless.cli.log('Error invoking post-deploy lambda', err);
			} else {
				serverless.cli.log('Post-deploy lambda successfully invoked');
			}
		});
	}
}

module.exports = VoiceFoundryDemo;
