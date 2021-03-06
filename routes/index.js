var express = require('express');
var router = express.Router();
var monk = require('monk');
var uuid = require('uuid/v4');
var csv = require('fast-csv');
var csvparse = require('csv-parser');
var AWS = require('aws-sdk');
const upload  = require('multer')();

require('dotenv').config();

AWS.config.update({ accessKeyId: process.env.S3_KEY, secretAccessKey: process.env.S3_SECRET });
const s3 = new AWS.S3();


/* GET home page. */
router.get('/', function(req, res) {
    var db = req.db;
    var collection = db.get('chortles');
    collection.find({},function(e,docs){
        res.json(docs);
    });
});

/* POST to Add Chortle */
router.post('/addchortle', upload.single('image'), function(req, res, next) {
  let db = req.db;
  let id = uuid();
  let params = {
    Bucket: process.env.S3_BUCKET,
    Key: id,
    Body: new Buffer(req.file.buffer)
  }

  s3.putObject(params, err => {
    if (err) {
      // console.log("err", err);
      next(err)
    } else {
      let collection = db.get('chortles');
      let root = 'https://s3.us-east-2.amazonaws.com/chortledemobucket/';
      collection.insert({
          username : req.body.userName,
          comment : req.body.userComment,
          image : root + id,
          longitude : req.body.userLongitude,
          latitude : req.body.userLatitude
      })
      .then(function(){
        res.json(`{"success": true}`)
      })
      .catch(function(err){
        res.json(`{"success": false}`)
        // console.log('err', err);
      })
    }
  })
});

module.exports = router;
