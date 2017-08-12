'use strict'
let express = require('express');
let bodyParser = require('body-parser');
let morgan = require('morgan');
let uuid = require('uuid');
let aws = require('aws-sdk');
let xlsx = require('xlsx');
let fs =  require('fs');



//region Networking Code Block
let mongoose = require('mongoose');

let file = fs.readFileSync('./result.json','utf8');
let V17494 = JSON.parse(file);

mongoose.connect('mongodb://localhost/mydb');


let db = mongoose.connection;
db.once('open', function () {
        // we are connected
        //console.log("Connection is established with mydb");
    });
let drawingSchema = mongoose.Schema({
        Key: String,
        Description: String,
        Symbol: String
    }, {
        collection: 'mycol'
    });
let Drawing = mongoose.model('Drawing', drawingSchema);
Drawing.find({Symbol: 'BCND'}).exec(function (err, result) {
    if (err) {
        //console.log(err)
    } else {
        //console.log("Successfully returned")
        //console.log(result)
    }
});


let config = require('./config');
let s3 = new aws.S3();
s3.config.update({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: 'us-east-1'
});
//endregion


let app = express();

// parsing incoming request
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// serve static files from /public
app.use(express.static(__dirname + '/public'));

// view engine setup
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// include routes
let routes = require('./routes/index');
//app.use('/v2', routes);

// catch 404 error and forward to error handler




let router = express.Router();

let keyDescriptions = [
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
];

router.route('/get_signed_url').get(getSignedURL);

router.route('/listObjects').get(getObjectList);

router.route('/getUrlAsync').get(getUrlAsync);

router.route('/parseExcel').get(parseExcel);

router.route('/getDrawings').get(getDrawings);

router.get('/register', function(req, res, next){
    res.render('register', {title: 'Sign up'});
});

router.post('/register', function(req, res, next){
    res.send("User created");
});

router.post('/V17492/:dwgId', function (req, res) {
    console.log(req.body);
    res.json({
        reqest: `Drawing: ${req.params.dwgId}`,
        body: req.body
    });
    
});

function parseExcel(req, res, next) {
    console.log("Parsing Excel");
    let workbook = xlsx.readFile("index.xls");
    let sheet = workbook.Sheets['Export'];
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

    let params = {
        Bucket: 'vpi-dcap',
        Key: uuid.v4(), // set new viersion 4 of uuid which will be the file name
        Expires: 100,
        ContentType: 'pdf'
    };

    s3.getSignedUrl('putObject', params, function (err, signedURL) {
        console.log("The Params.key");
        console.log(params.key);
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


    //Getting all the keys for the buckets
    let params = {
        Bucket: 'vpi-dcap',
        Delimiter: '',
        Prefix: ''
    };

    let bucketObjectKeys;
    s3.listObjects(params, function (err, data) {
        if (!err) {
            bucketObjectKeys = data.Contents.map(a => a['Key']
        );
            //res.json(bucketObjectKeys)

            let objectKey = '';
            let urlResults = [];
            let url = '';
            let description = '';
            let symbol = '';

            for (let i = 0; i < bucketObjectKeys.length; i++) {
                objectKey = bucketObjectKeys[i];
                //objectKey = 'V17492-ICND-0005.pdf'
                url = s3.getSignedUrl('getObject', {Bucket: 'vpi-dcap', Key: objectKey, Expires: ( 86400 * 5 )});
                description = keyDescriptions.filter(a => a['key'] === objectKey
            );
                description = description.length > 0 ? description[0]['description'] : "";
                urlResults.push({key: objectKey, url: url, description: description});
            }

            res.json({result: urlResults});
        } else {
            console.log(err);
            next(err)
        }
    });




}

function getObjectList(req, res, next) {
    let params = {
        Bucket: 'vpi-dcap',
        Delimiter: '',
        Prefix: ''
    };

    s3.listObjects(params, function (err, data) {
        if (err) {
            console.log(err);
            next(err)
        } else {
            console.log(data);
            let objs = res.json(data);
            console.log(objs);
            res.json(data)
        }
    })
}

function getDrawings(req, res, next) {
    let params = {
        Bucket: 'vpi-dcap',
        Delimiter: '',
        Prefix: ''
    };

    s3.listObjects(params, function(err, data) {

        let dwgKeys = data.Contents.map( a => a['Key']);
        let dwgDesc = dwgKeys.map( a => {
            let des = keyDescriptions.filter( d => d.key === a );
            return {key: a, description: des[0].description} });
        let dwgSyms = dwgDesc.map( a => {
            let ke = a.key;
            let sy = ke.slice(7, 11);
            return {key: a.key, description: a.description, symbol: sy} });
        let dwgUrls = dwgSyms.map( a => {
            let url = s3.getSignedUrl('getObject', {Bucket: 'vpi-dcap', Key: a.key, Expires: ( 86400 * 5 )});
            return {key: a.key, description: a.description, symbol: a.symbol, url: url}
        });
        fs.writeFile('./index.json', JSON.stringify(dwgUrls, null, 2), 'utf8', function (err) {
            if (err) throw err;
            console.log("The output.json File has been saved");
        });
        res.json(dwgUrls);
    })


}



app.use(morgan('combined'));
app.use('/v1', router);



let PORT = process.env.PORT || 3000;
let HOST = process.env.HOST || '127.0.0.1';

console.log("Listening on ", HOST, PORT);
app.listen(PORT, HOST);
