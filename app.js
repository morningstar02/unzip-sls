const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const querystring = require('querystring');
// aws-sdk is always preinstalled in AWS Lambda in all Node.js runtimes
const AWS = require('aws-sdk');
const app = express();
app.use(cors());
const router = express.Router()
const AdmZip = require('adm-zip');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


AWS.config.credentials = new AWS.Credentials({
  accessKeyId: process.env.accessKeyId ,
  secretAccessKey: process.env.secretAccessKey,
});

router.get('/', function (req, res) {
    let test = {};
    res.json(test);
});

const unzipAndGetIndex = async (url) => {

  const bucket = process.env.S3_BUCKET;
  console.log('bucket set', bucket);

  let key = url;
  key = key.substring(key.indexOf('brands'));
  const find = '%20';
  const regex = new RegExp(find, 'g');
  key = key.replace(regex, ' ');
  const params = {
    Bucket: bucket,
    Key: key
  };

  const s3 = new AWS.S3();
  const zipFile = await s3.getObject(params).promise();
  const zip = new AdmZip(zipFile.Body);
  const zipEntries = zip.getEntries(); // ZipEntry objects

  let uploadedIndexFilePath = '';
  const newKey = key.substring(0, key.lastIndexOf('.zip'));
  for (const zipEntry of zipEntries) {
    const entryParams = {
      Bucket: bucket,
      Key: `${newKey}/unzip/${zipEntry.entryName}`,
      Body: zipEntry.getData()
    };
    if (zipEntry.name.indexOf('index') > -1 && zipEntry.name.indexOf('.html') > -1 ||
      zipEntry.name.indexOf('.htm') > -1) {
      entryParams.ContentType = 'text/html';
    }
    if (zipEntry.name.indexOf('.css') > -1) {
      entryParams.ContentType = 'text/css';
    }
    if (zipEntry.name.indexOf('.css') > -1) {
      entryParams.ContentType = 'text/css';
    }
    if (zipEntry.name.indexOf('.jpg') > -1 || zipEntry.name.indexOf('.jpeg') > -1) {
      entryParams.ContentType = 'image/jpeg';
    }
    if (zipEntry.name.indexOf('.png') > -1) {
      entryParams.ContentType = 'image/png';
    }
    if (zipEntry.name.indexOf('.gif') > -1) {
      entryParams.ContentType = 'image/gif';
    }
    const data= await new AWS.S3.ManagedUpload({ params: entryParams }).promise();
    const location = data.Location;
    const indexStringSplit = location.split('/');
    if (indexStringSplit[indexStringSplit.length - 1].toLowerCase() === 'index.html' ||
    indexStringSplit[indexStringSplit.length - 1].toLowerCase() === 'index.htm') {
      uploadedIndexFilePath = location;
      console.log('index found: ', uploadedIndexFilePath);
    }
  }
  return  uploadedIndexFilePath;
}

router.get('/unzipAndGetIndex', async function (req, res) {
  let url = req.query.url;
  console.log('###########url:', url);
  const uploadedIndexFilePath = await unzipAndGetIndex(url);

  res.json({ status: true, message: 'file unzipped successfully', indexFilePath: uploadedIndexFilePath });
});

router.post('/unzipAndGetIndex', cors(), async function (req, res) {
  let url = req.body.url;

  const uploadedIndexFilePath = await unzipAndGetIndex(url);

  res.json({ status: true, message: 'file unzipped successfully', indexFilePath: uploadedIndexFilePath });
});


app.use('/', router)
module.exports = app