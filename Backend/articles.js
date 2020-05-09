var mongodb = require('mongodb');

var app_main = require('./app');

// EXERCICE 2

//------------------------------ RECUPERER TOUS MES ARTICLES  ----------------------------
app_main.app.get('/:login', function(req, res) {
    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    // etape 1 : recuperer le login dans l'url
    let userLogin = req.params.login
    // etape 2 : recuperer l user dans la collection en fonction du login 
    app_main.getDBO().collection("users").findOne({login: userLogin}, function(err, result){
        // recuper les articles dont l user_id correspondont a celui de l user 
        app_main.getDBO().collection("articles").find({user_id: new mongodb.ObjectID(result._id)}).toArray(function(err, rst_c){
            rst_c.forEach((element,index) => {
                app_main.getDBO().collection('users').find({_id: new mongodb.ObjectID(rst_c[index].user_id)}).toArray(function(err, rst_user){
                    rst_c[index].author = rst_user[0].login
                    if (index == rst_c.length -1) {
                        setTimeout(function(){ 
                            rst.error = null
                            rst.data = rst_c
                            res.end(JSON.stringify(rst))    
                         }, 100);
                    }
                    
                });
            })
            
        })
    
        // {
        //     "error": null,
        //     "data": [
        //         {
        //             "_id": "5ea170cd16d5ee795fd9f1fc",
        //             "title": "article1ddddddddd",
        //             "content": "laura123ggggggggggggggdddddddddd",
        //             "picture": "bbbbbbbbbbbbbb",
        //             "user_id": "5e9f136425e1092579962e90"
        //         },
        //         {
        //             "_id": "5ea170e816d5ee795fd9f1fe",
        //             "title": "article1ddddddddd",
        //             "content": "laura1ddjjjjjjjjjjjjjjj",
        //             "picture": "bbbbbbbbbbbbbb",
        //             "user_id": "5e9f136425e1092579962e90"
        //         }
        //     ]
        // }
    })
})

//CREATE
//------------------------------ CREATE ARTICLES ----------------------------
app_main.app.post('/article', function (req, res) {
    var rst = {}
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
            var article = {
                title : req.body.title,
                content : req.body.content,
                picture : req.body.picture,
                user_id : new mongodb.ObjectID(result.user_id)
            }

            // Si j'arive ici -> j'ai un token et je l'ai trouve un db, 
            // chaque session contient un user_id, je peux donc creer un article associe au user 
            app_main.getDBO().collection('articles').insertOne(article, function(err, result_article) {
                if (err || result_article == null) {  
                    rst.error = {"reason" : "bad payload"}
                    rst.data = null
                    res.end(JSON.stringify(rst))
                    return  
                } else {
                    rst.error = null;
                    rst.data = article;
                    res.end(JSON.stringify(rst))
                    // {
                    //     "error": null,
                    //     "data": {
                    //         "title": "article1",
                    //         "content": "laura123gggggggggggggg",
                    //         "picture": "bbbbbbbbbbbbbb",
                    //         "user_id": "5ea16d04410b85783297dea0",
                    //         "_id": "5ea16ddd48edfd78536c0773"
                    //     }
                    // }
                    return    
                }
            })
        }
    })
})

//modify
app_main.app.post('/article/:art_id', function (req, res) {
    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    var articleId = req.params.art_id
    var article = {
        title : req.body.title,
        content : req.body.content,
        picture : req.body.picture,
    }
    var myquery = { _id: new mongodb.ObjectID(articleId) };
    var newvalues = {$set: article};
    app_main.getDBO().collection("articles").updateOne(myquery, newvalues, function(err, result) {
        if (err || result == null) {  
            rst.error = {"reason" : "bad payload"}
            rst.data = null
            res.end(JSON.stringify(rst))
            return  
        }
        else {
            rst.error = null
        rst.data = article
        res.end(JSON.stringify(rst))
        }
    });
})

//details
app_main.app.get('/article/:art_id', function (req, res) {
    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    var articleId = req.params.art_id
    app_main.getDBO().collection("articles").findOne({_id: new mongodb.ObjectID(articleId)}, function(err, result){
        if (err || result == null) {  
            rst.error = {"reason" : "internal server error"}
            rst.data = null
            res.end(JSON.stringify(rst))
            return  
        }
        else {
            app_main.getDBO().collection('users').find({_id: new mongodb.ObjectID(result.user_id)}).toArray(function(err, rst_user){
                app_main.getDBO().collection("comments").find({art_id : new mongodb.ObjectID(result._id)}).toArray(function(err, rst_c){
                result.author = rst_user[0].login
                result.comments = rst_c
                if (rst_c.length == 0) {
                    rst.error = null
                    rst.data = result
                    res.end(JSON.stringify(rst))
                    return 
                }
                result.comments.forEach((element,index) => {
                    app_main.getDBO().collection('users').find({_id: new mongodb.ObjectID(result.comments[index].user_id)}).toArray(function(err, rst_u){
                        rst_c[index].author = rst_u[0].login
                            if (index == result.comments.length -1) {
                                rst.error = null
                                rst.data = result
                                res.end(JSON.stringify(rst))
                                // {
                                //     "error": null,
                                //     "data": {
                                //         "_id": "5ea29527b1a1221efe29e773",
                                //         "title": "article1",
                                //         "content": "laura123hhhhhhh",
                                //         "picture": "bbbbbbbbbbbbbb",
                                //         "user_id": "5e9f136425e1092579962e90",
                                //         "author": "Vincent",
                                //         "comments": [
                                //             {
                                //                 "_id": "5ea2a31840728c22508febde",
                                //                 "content": "hellooo",
                                //                 "art_id": "5ea29527b1a1221efe29e773",
                                //                 "user_id": "5e9f136425e1092579962e90",
                                //                 "author": "Vincent"
                                //             },
                                //             {
                                //                 "_id": "5ea2a31f40728c22508febdf",
                                //                 "content": "bouducon",
                                //                 "art_id": "5ea29527b1a1221efe29e773",
                                //                 "user_id": "5e9f136425e1092579962e90",
                                //                 "author": "Vincent"
                                //             }
                                //         ]
                                //     }
                                // }
                            }
                    })
                
                })
            })
    })
}
})
})

//delete
app_main.app.delete('/article/:art_id', function (req, res) {
    var rst = {}
    if(req.query.token == undefined){
        rst.error = {"reason" : "you are not logged in"}
        rst.data = null
        res.end(JSON.stringify(rst))
        return
    }
    var articleId = req.params.art_id
    app_main.getDBO().collection('articles').deleteOne({_id: new mongodb.ObjectID(articleId)});
    rst.error = null
    rst.data = ""
    res.end(JSON.stringify(rst))
});
