const AWS = require("aws-sdk");
const multipart = require("parse-multipart");
const s3 = new AWS.S3();
const bluebird = require("bluebird");

exports.handler = function (event, context) {
  let result = [];

  var bodyBuffer = Buffer.from(event["body-json"].toString(), "base64");

  var boundary = multipart.getBoundary(event.params.header["Content-Type"]);

  var parts = multipart.Parse(bodyBuffer, boundary);

  let files = getFiles(parts);

  return bluebird
    .map(files, (file) => {
      console.log(`uploadCall!!!`);
      return upload(file).then(
        (data) => {
          result.push({ data, file_url: file.uploadFile.full_path });
          console.log(`data=> ${JSON.stringify(data, null, 2)}`);
        },
        (err) => {
          console.log(`s3 upload err => ${err}`);
        }
      );
    })
    .then((_) => {
      return context.succeed(result);
    });
};

let upload = function (file) {
  console.log(`putObject call!!!!`);
  return s3.upload(file.params).promise();
};

let getFiles = function (parts) {
  let files = [];
  parts.forEach((part) => {

    let buffer = part.data
    let fileFullName = "images/origin/" + part.filename;

    let filefullPath = "https://serverless-gyunny-bucket.s3.ap-northeast-2.amazonaws.com" + fileFullName;

    let params = {
      Bucket: "serverless-gyunny-bucket",
      Key: fileFullName,
      Body: buffer,
    };

    let uploadFile = {
      size: buffer.toString("ascii").length,
      type: part.type,
      name: fileFullName,
      full_path: filefullPath,
    };

    files.push({ params, uploadFile });
  });
  return files;
};
