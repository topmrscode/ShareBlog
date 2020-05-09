
//------------------------------ REQUIRES AND VARIABLES ----------------------------
const express = require('express')
var bodyParser = require('body-parser');

const app = express()

// On definit le port sur lequel notre Backend sera joignable
const port = 4242

// bodyparser.json() permet de parser le body des requetes PUT, PATCH et POST en JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Ce middleware permet d'accepter les requetes CORS
// Ca permet a notre frontend de nous contacter
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Ce middleware permet de faire plusieurs etapes distinces
app.use(function(req,res,next){
    // Indique au frontend que l'on va lui repondre en JSON
    res.setHeader('Content-Type', 'application/json');

    // On recupere le token qui est dans l'URL sous la forme d'un query parameter
    // Exemple : https://localhost:4242/users?token=montoken
    let tok = req.query.token
    // Si il y a un token, on va le chercher dans la collection session afin de trouver la session correspondante
    // Une fois que l'on a la session, on va chercher le user associé grace au user_id qui est dans la session
    if (tok != undefined) {
        dbo.collection("sessions").findOne({token : tok},function(err, result) {
            if (err || result == null){
                console.log("bad token given as parameters")
            }
            else {
                dbo.collection("users").findOne({_id: result.user_id}, function(err, rst_user) {
                    if (err == null && rst_user != null) {
                        // locals => un dictionnaire cree par express qui permet de balader mes variables
                        // de mon midllware a mon handler 
                        res.locals.c_user = rst_user
                    }
                })
            }
        })
    }
    next();
})
// variable pour faire une requete a la db
var dbo;

// permet de recuperer la variable dbo dans les autres fichiers via getDBO
exports.getDBO = function() {
    return dbo;
};

// permet de changer la valeur de la variable dbo dans les autres fichiers via setDBO
exports.setDBO = function(_dbo) {
    dbo = _dbo
};


exports.app = app;

var mongodb = require('./mongodb');
var auth = require('./auth');
var comments = require('./comments');
var articles = require('./articles');

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
