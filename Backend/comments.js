var mongodb = require('mongodb');

var app_main = require('./app');

// EXERCICE 3

// ------------------- LIST ALL COMMENTS RELATIF A UN ARTICLE -----------------
app_main.app.get('/article/:art_id/comments', function(req, res){
    // etape 1 : 
    //- creation de notre dictionnaire final 
    //- Verfication connexion user

    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    // epate 2 : recuperation du parametre de l url (art_id)
    var articleId = req.params.art_id
    app_main.getDBO().collection("comments").find({art_id: new mongodb.ObjectID(articleId)}).toArray(function(err, result){
        if (err || result == null) {  
            rst.error = {"reason" : "internal server error"}
            rst.data = null
            res.end(JSON.stringify(rst))
            return  
        }
        else {
            result.forEach((element,index) => {
                app_main.getDBO().collection('users').find({_id: new mongodb.ObjectID(result[index].user_id)}).toArray(function(err, rst_user){
                    result[index].author = rst_user[0].login
                    if (index == result.length -1) {
                        rst.error = null
                        rst.data = result
                        res.end(JSON.stringify(rst))
                    }    
                });
            })         
        }
    })
})

// ------------------- CREATE COMMENTS  -----------------

app_main.app.post('/article/:art_id/comments', function(req, res) {

    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    // recuperatin de l id de l article 
    var articleId = req.params.art_id
    // recuperation du token
    let tok = req.query.token;
    app_main.getDBO().collection('sessions').findOne({token : tok}, function(err, result) {
        if (err || result == null) {
            rst.error = {"reason" : "you are not logged in"}
            rst.data = null
            res.end(JSON.stringify(rst))
            return    
        } 
        else {
            var comment = {
                content : req.body.content,
                art_id : new mongodb.ObjectID(articleId),
                user_id : new mongodb.ObjectID(result.user_id)
            }
            app_main.getDBO().collection('comments').insertOne(comment, function(err, result_comment) {
                if (err || result_comment == null) {  
                    rst.error = {"reason" : "bad payload"}
                    rst.data = null
                    res.end(JSON.stringify(rst))
                    return  
                } else {
                    rst.error = null;
                    rst.data = comment;
                    res.end(JSON.stringify(rst))
                    return    
                }
            })
        }       
    })
})

// GET COMMENT BY ITS ID ---------------
app_main.app.get('/comments/:comment_id', function(req, res){

    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    // epate 2 : recuperation du parametre de l url 
    var commentId = req.params.comment_id
    app_main.getDBO().collection("comments").find({_id: new mongodb.ObjectID(commentId)}).toArray(function(err, result){
        if (err || result == null) {  
            rst.error = {"reason" : "internal server error"}
            rst.data = null
            res.end(JSON.stringify(rst))
            return  
        }
        else {
            rst.error = null
            rst.data = result[0]
            res.end(JSON.stringify(rst))
                    
        }       
    })
})

//modify
app_main.app.post('/comments/:comment_id', function (req, res) {

    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    var commentId = req.params.comment_id
    var comment = {
        content : req.body.content,
    }
    var myquery = { _id: new mongodb.ObjectID(commentId) };
    var newvalues = {$set: comment};
    app_main.getDBO().collection("comments").updateOne(myquery, newvalues, function(err, result) {
        if (err || result == null) {  
            rst.error = {"reason" : "bad payload"}
            rst.data = null
            res.end(JSON.stringify(rst))
            return  
        }
        else {
            rst.error = null
        rst.data = comment
        res.end(JSON.stringify(rst))
        }
    });
})

// ------------------- DELETE COMMENTS  -----------------

app_main.app.delete('/article/:art_id/comments/:com_id', function (req, res) {
    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    var commentId = req.params.com_id

    app_main.getDBO().collection('comments').deleteOne({_id: new mongodb.ObjectID(commentId)});
    rst.error = null
    rst.data = ""
    res.end(JSON.stringify(rst))
});