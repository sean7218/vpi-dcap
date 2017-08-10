var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var uuid = require('uuid');
var aws = require('aws-sdk');
var xlsx = require('xlsx');
var fs =  require('fs');
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017/mydb', function(err, db) {
    if (err) throw err

    db.collection('mycol').find({"result": {}}).toArray(function(err, result) {

        if (err) throw err

        console.log(result)

    })

})

var config = require('./config');
var s3 = new aws.S3();
s3.config.update({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: 'us-east-1'
});

var app = express();


var router = express.Router();

var keyDescriptions = [
    {
        key: "V17492-ICND-0001.pdf",
        description: "P&ID Legends and Notes"
    },
    {
        key: "V17492-ICND-0002.pdf",
        description: "Flue Gas P&ID"
    },
    {
        key: "V17492-ICND-0003.pdf",
        description: "Burner & Ammonia Injection Grid P&ID "
    },
    {
        key: "V17492-ICND-0004.pdf",
        description: "HP Evaporator & Economizer P&ID"
    },
    {
        key: "V17492-ICND-0005.pdf",
        description: "HP Superheater P&ID"
    },
    {
        key: "V17492-ICND-0006.pdf",
        description: "IP Evaporator & Economizer P&ID"
    },
    {
        key: "V17492-ICND-0007.pdf",
        description: "IP Superheater P&ID"
    },
    {
        key: "V17492-ICND-0008.pdf",
        description: "LP Economizer P&ID"
    },
    {
        key: "V17492-ICND-0009.pdf",
        description: "LP Evaporator & Superheater P&ID"
    },
    {
        key: "V17492-ICND-0010.pdf",
        description: "Reheater P&ID"
    },
    {
        key: "V17492-ICND-0011.pdf",
        description: "Blowdown Tank P&ID"
    },
    {
        key: "V17492-ICND-0012.pdf",
        description: "ISilencer Vents and Drains P&ID"
    },
    {
        key: "V17492-ICND-0013.pdf",
        description: "Process Flow Diagram"
    },
    {
        key: "index.json",
        description: "Main Document Index"
    }
]

router.route('/get_signed_url').get(getSignedURL);

router.route('/listObjects').get(getObjectList);

router.route('/getUrlAsync').get(getUrlAsync);

router.route('/parseExcel').get(parseExcel);



function parseExcel(req, res, next) {
    console.log("Parsing Excel")
    let workbook = xlsx.readFile("index.xls")
    let sheet = workbook.Sheets['Export']
    let result = xlsx.utils.sheet_to_json(sheet);

    let docs = result.map( x => {
        let key = x['Document No'];
        let description = x['Description'];
        let symbol = "";
        if (key.length > 7) {
            symbol = key.slice(7,11);
        } else {
            symbol = ""
        }

        return { "Key": key, "Description": description, "Symbol": symbol };
    });

    fs.writeFileSync('./result.json', JSON.stringify(docs, null, 4), 'utf-8');
    res.send(docs);
}

function getSignedURL(req, res, next) {

    var params = {
        Bucket: 'vpi-dcap',
        Key: uuid.v4(), // set new viersion 4 of uuid which will be the file name
        Expires: 100,
        ContentType: 'pdf'
    };

    s3.getSignedUrl('putObject', params, function (err, signedURL) {
        console.log("The Params.key")
        console.log(params.key)
        if (err) {
            console.log(err);
            return next(err);
        } else {
            return res.json({
                postURL: signedURL,
                getURL: signedURL.split("?")[0]
            })
        }
    })
}

function getUrlAsync(req, res, next) {

    console.log(req);

    //Getting all the keys for the buckets
    var params = {
        Bucket: 'vpi-dcap',
        Delimiter: '',
        Prefix: ''
    };

    var bucketObjectKeys;
    s3.listObjects(params, function (err, data) {
        if (err) {
            console.log(err)
            next(err)
        } else {
            bucketObjectKeys = data.Contents.map(a => a['Key'])
            //res.json(bucketObjectKeys)

            var objectKey = ''
            var urlResults = []
            var url = ''
            var description = ''

            for (var i = 0; i < bucketObjectKeys.length; i++) {
                objectKey = bucketObjectKeys[i]
                //objectKey = 'V17492-ICND-0005.pdf'
                url = s3.getSignedUrl('getObject', {Bucket: 'vpi-dcap', Key: objectKey, Expires: ( 86400 * 5 )})
                description = keyDescriptions.filter(a => a['key'] === objectKey
            )
                description = description.length > 0 ? description[0]['description'] : ""
                urlResults.push({key: objectKey, url: url, description: description});
            }

            res.json({result: urlResults});
        }
    });


    // objectKey = 'V17492-ICND-0005.pdf'
    // url = s3.getSignedUrl('getObject', { Bucket:'vpi-dcap',   Key: objectKey })
    // urlResults.push({key: objectKey, url: url});
    //
    // objectKey = "seanbarb.jpg"
    // url = s3.getSignedUrl('getObject', { Bucket:'vpi-dcap',   Key: objectKey })
    // urlResults.push({key: objectKey, url: url});


    //res.json({result:urlResults});


}

function getObjectList(req, res, next) {
    var params = {
        Bucket: 'vpi-dcap',
        Delimiter: '',
        Prefix: ''
    }

    s3.listObjects(params, function (err, data) {
        if (err) {
            console.log(err)
            next(err)
        } else {
            console.log(data)
            var objs = res.json(data)
            console.log(objs)
            res.json(data)
        }
    })
}

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use('/v1', router);



var PORT = process.env.PORT || 3000;
var HOST = process.env.HOST || '127.0.0.1';

console.log("Listening on ", HOST, PORT);
app.listen(PORT, HOST);
