'use strict'
const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app')

const binaryMimeTypes = [
  'application/octet-stream',
  'font/eot',
  'font/opentype',
  'font/otf',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'application/pdf'
]
const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes)

module.exports.unzipFetchIndex = (event, context) => awsServerlessExpress.proxy(server, event, context)