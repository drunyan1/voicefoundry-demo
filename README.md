# Overview of this project

## Problem statement and design
The assignment was to write a serverless framework that creates a Lambda, an S3 bucket, and a DynamoDB table. The application should expose an http endpoint to allow
users to upload files, which would be stored in the S3 bucket. An event handler is set on the S3 bucket so that when a text file is written to the bucket,
a separate lambda is called to read that file and write its contents to the DynamoDB table.

A custom plugin was written so that immediately upon deployment, the upload endpoint was called to upload a local initialization file.

The following artifacts were created in AWS:
* __voicefoundry-demo-bucket__ - The S3 bucket used to store uploaded files
* __voicefoundry-demo-table__ - The DynamoDB table used to store the contents of the uploaded files
* __voicefoundry-demo-upload__ - A Lambda that accepts file data and stores it in S3, exposed as an http POST endpoint
* __voicefoundry-demo-parse__ - A Lambda that is triggered by new text files in the S3 bucket, which copies the content of the files to DynamoDB
* __voicefoundry-demo-plugin__ - A custom serverless plugin that runs automatically on deployment and uploads a file via _voicefoundry-demo-upload_

## Code style and documentation
I used a combination of Prettier and ESLint to format and clean all of the code in this project. I used Airbnb as my linting ruleset. 
Inside my JavaScript files, I used JSDoc comment blocks, so that documentation can be auto-generated using the jsdoc tool.


