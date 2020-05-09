var mongodb = require('mongodb');

var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');

var app_main = require('./app');

// EXERCICE 2
// ------------------------- REGISTER -------------------------------------
app_main.app.post('/register', function (req, res) {
    // ETAPE 1 : recuperer les donnes du form
    var user = {
        login : req.body.login,
        email : req.body.email,
        password : req.body.password,
        type : false
    }
    //  creation de mon dico qui contiendra une data et une erreur 
    var rst = {}

    var passwordConf = req.body.passwordConf
    // verification du confirm password
    if (user.password != passwordConf) {
        rst.data = null
        rst.error = { "reason" : "invalid password confirmation" }
        // res.end => remvoyer une chaine de caractere "jsoner" au frontend
        res.end(JSON.stringify(rst))
        return
    } 

    user.password = passwordHash.generate(user.password)
    // ETAPE 2 : inserer mes donnees dans ma db
    // a. appel a la db 
    var col = app_main.getDBO().collection("users") 
    // b. inserer dans la db le dictionnaire student
    col.insertOne(user, function(err, data){
        if (err) {
            rst.data = null
            res.status(409);
            rst.error = {"reason" : "User already exist."}
        }
        else {
            rst.data = {"user" : user}
            rst.error = null
        }
        // etape 3 : renvoyer au front end
        res.end(JSON.stringify(rst))
    });
})

//------------------------------ LOGIN ----------------------------
app_main.app.post('/login', function (req, res) {
    var user = {
        login : req.body.login,
        password : passwordHash.generate(req.body.password)
    }
    var rst = {}

    var col = app_main.getDBO().collection("users") 
    col.findOne({login : req.body.login}, function(err, result) {
        if (err || result == null) {
            rst.data = null
            rst.error = {"reason" : "user not found"}
        }
        else {
            if (passwordHash.verify(req.body.password, result.password)) {
                var token = jwt.sign({ user: result }, 'keyofjwt');
                rst.data = {
                    "token" : token,
                    "user" : result
                }
                rst.error = null
                // etape 2 : creer une session dans ma collection session
                app_main.getDBO().collection("sessions").insertOne({token : token, user_id : new mongodb.ObjectID(result._id)})
            }
            else {
                rst.error = {reason : "invalid password"}
                rst.data = null 
            }
        } 
        res.end(JSON.stringify(rst))
    })
})

// EXERCICE 5
//------------------------------ LIST ALL USERS ----------------------------
app_main.app.get("/users", function (req, res) {
    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    app_main.getDBO().collection("users").find({}).toArray(function(err, result) {
        if (err || result == null) {  
            rst.error = {"reason" : "bad payload"}
            rst.data = null
            res.end(JSON.stringify(rst))
            return  
        }
        else {
            rst.error = ""
            rst.data = result
            res.end(JSON.stringify(rst))
        }
    })
})

//------------------------------ LOGOUT ----------------------------
app_main.app.get("/logout", function (req, res) {
    // etape 1 : recuperer le token en parametre durl, verifier quil y en est sinon redirect home
    // si token verifier aue lon a en db 
    // si oui on le supprime  et res.end
    var rst = {}

    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return ;
    }
    app_main.getDBO().collection('sessions', function(err, collection) {
        collection.deleteOne({token: req.query.token});
    });
    rst.error = null
    rst.data = ""
    res.end(JSON.stringify(rst))  
})

app_main.app.get('/users/me', function(req, res) {
    // etape 1 : recuperer le token en parametre durl, verifier quil y en est sinon redirect home
    // si token verifier aue lon a en db 
    // si oui on le supprime  et res.end
    var rst = {}

    // etape 2 : cete route ne fonctionne QUE si on lui donne un token, autrement elle ne doit rien faire
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    let tok = req.query.token;
    app_main.getDBO().collection('sessions').findOne({token : tok}, function(err, result) {
        if (err || result == null) {
            rst.error = {"reason" : "you are not logged in"}
            rst.data = null
            res.end(JSON.stringify(rst))
            return    
        } else {
            // Si j'arive ici -> j'ai un token et je l'ai trouve un db, 
            // chaque session contient un user_id, je veux donc le user associe
            app_main.getDBO().collection('users').findOne({_id : new mongodb.ObjectID(result.user_id)}, function(err, result_user) {
                if (err || result_user == null) {
                    rst.error = {"reason" : "you are not logged in"}
                    rst.data = null
                    res.end(JSON.stringify(rst))
                    return    
                } else {
                    rst.error = null;
                    rst.data = result_user;
                    res.end(JSON.stringify(rst))
                    return    
                    // Si j'arive ici -> j'ai un token et je l'ai trouve un db, 
                    // chaque session contient un user_id, je veux donc le user associe
                }
            })
        }
    })
})