var express=require("express");
var mysql=require("mysql");
var cookieParser = require('cookie-parser');
var session = require('express-session');
var dateFormat = require('dateformat');
var dateTime = require('node-datetime');
var bodyParser =require("body-parser");
var multer  = require('multer');
var fs = require('fs');


var app=express();

var dt = dateTime.create();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

app.use(session({
    cookieName: 'session',
    secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;;to8',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true,
    resave: true,
    saveUninitialized: true
}));

app.use(function(req, res, next) {

    if (req.session && req.session.user) {
        var sql = "select * from login where user_id="+req.session.user.user_id+";";
        connection.query(sql, function(err, user) {
            if (user) {
                req.user = user[0];
                delete req.user.password; // delete the password from the session
                req.session.user = user[0];  //refresh the session value
                res.locals.user = user[0];
            }
            // finishing processing the middleware and run the route
            next();
        });
    } else {
        next();
    }
});


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname+'/public/upload/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname+ '-' + Date.now()+'.pdf')
    }
});
var upload = multer({ storage: storage });


var connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'admin',
    database:'student_gs'
});

connection.connect(function(err){
    if(!err) {
        console.log("Database is connected ... nn");
    } else {
        console.log("Error connecting database ... nn");
    }
});






app.get("/",function(req,res){
    res.sendFile(__dirname + '/public' + '/views/LoginRegistrationForm.html');
});


app.post("/registration", function (req, res) {

   var fname = req.body.fname;
   var DOB = req.body.DOB;
   var Mobile_No=req.body.Mobile_No;
   var Branch = req.body.Branch;
   var year = req.body.year;
   var mail = req.body.mail;
   var  userId = req.body.userId;
   var password = req.body.password;
   var confirm_password = req.body.confirm_password;
    dateFormat(DOB, "isoDate");
    var sql1 =  "select user_id from login where user_id="+userId+";";

    connection.query(sql1, function (err, result) {
        if (err){
            console.log(err);
        }
        numrow=result.length;
        if(numrow==0){

            var sql = "INSERT INTO grievance_by (std_id, std_name, dob, std_dept_id, std_year, std_email_id, mobile_no) VALUES ?";
            var values = [
                [userId, fname, DOB, Branch, year, mail, Mobile_No]
            ];
            connection.query(sql, [values], function (err, result) {
                if (err){
                    console.log(err);
                }
                console.log(result.affectedRows + " record(s) updated2");
            });
            var sql = "INSERT INTO login (user_id, pass) VALUES ?";
            var values = [

                [userId, password]
            ];
            connection.query(sql, [values], function (err, result) {
                if (err){
                    console.log(err);
                }
                console.log(result.affectedRows + " record(s) updated3");
                res.redirect("/");
            });
        }
        else{
            console.log("invalid userid");
            res.redirect("/");
        }
    });

});
app.post('/login', function(req, res, next) {

    //console.log(req.body);
    var sql = "select * from login where user_id="+req.body.uname+";";
    connection.query(sql, function (err, user) {
        if (err){
            console.log(err.code);
            res.redirect('/');
        }
        if (!user[0]) {
            res.redirect('/');
            //console.log("ggg");
        } else {
            if (req.body.Loginpassword == user[0].pass && req.body.user_Type == user[0].user_type) {
                // sets a cookie with the user's info
                req.session.user = user[0];
                //console.log("hhh");
                if(user[0].user_type=='Admin'){
                    res.redirect('/ADMIN');
                }
                if(user[0].user_type=='Cell Member'){
                    res.redirect('/CELL_MEMBER');
                }
                if(user[0].user_type=='Student'){
                    res.redirect('/dashboard');
                }

            } else {
                //console.log("kkk");
                res.redirect('/');
            }
        }
        console.log(" login successful");
    });


});

function requireLogin (req, res, next) {
    if (!req.user) {
        res.redirect('/');
    } else {
        next();
    }
};

var user_name;


app.get('/dashboard', requireLogin, function(req, res) {

    var sql = "SELECT std_name FROM grievance_by WHERE std_id="+req.session.user.user_id;
    connection.query(sql, function (err, result) {
        if (err) {
            console.log(err);
        }

        user_name=result[0].std_name;
    });

    res.sendFile(__dirname + '/public' + '/views/student_interface.html');
});

app.get('/CELL_MEMBER', requireLogin, function(req, res) {

    var sql = "SELECT cell_member_name FROM grievance_to WHERE cell_member_id="+req.session.user.user_id;
    connection.query(sql, function (err, result) {
        if (err) {
            console.log(err);
        }

        user_name=result[0].cell_member_name;
    });

    res.sendFile(__dirname + '/public' + '/views/cell_member_interface.html');
});

app.get('/ADMIN', requireLogin, function(req, res) {

    var sql = "SELECT cell_member_name FROM grievance_to WHERE cell_member_id="+req.session.user.user_id;
    connection.query(sql, function (err, result) {
        if (err) {
            console.log(err);
        }

        user_name=result[0].cell_member_name;
    });

    res.sendFile(__dirname + '/public' + '/views/admin_interface.html');
});


app.post("/session_data", function(req, res) {

    res.send(user_name);

});




app.post("/cdata", function(req, res) {
    var sql1 = "select dept_name from department;";
    var sql2 = "select dept_name from department WHERE dept_id>8;";
    connection.query(sql1, function (err, result1) {
        if (err){
            console.log(err);
        }
        connection.query(sql2, function (err, result2) {
            if (err){
                console.log(err);
            }
            var total = [];
            total.push(result1);
            total.push(result2);

            //console.log(total);
            res.json(total);

        });
    });
});

app.post("/cell_dept_data", function(req, res){

    var department = req.body.dept_name;

    var sql = "SELECT A.desig_name " +
        "FROM designation AS A, grievance_to AS B " +
        "WHERE B.cell_member_dept_id IN (SELECT dept_id FROM department where dept_name='"+department+"') " +
        "AND A.desig_id=B.cell_member_desig_id";

    connection.query(sql, function (err, result) {
        if (err){
            console.log(err);
        }
        //console.log(result);
        res.json(result);

    });
});

app.post("/cell_auth_data", function(req, res){

    var desig_name = req.body.desig_name;

    var sql = "SELECT B.cell_member_name " +
        "FROM designation AS A, grievance_to AS B " +
        "WHERE A.desig_name='" + desig_name +"' " +
        "AND A.desig_id=B.cell_member_desig_id;";

    connection.query(sql, function (err, result) {
        if (err){
            console.log(err);
        }
        //console.log(result);
        res.json(result);

    });
});

app.post("/G_dept_data", function(req, res){

    var dept_name = req.body.dept_name;

    var sql = "SELECT gtype " +
        "FROM grivance_type " +
        "WHERE department IN (SELECT dept_id FROM department where dept_name='"+dept_name+"');";

    connection.query(sql, function (err, result) {
        if (err){
            console.log(err);
        }
        //console.log(result);
        res.json(result);

    });
});

app.post('/multer', upload.single('file'), function (req, res, next) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    const file = req.file;
    var link=req.file.filename;

    //console.log(file);
    if (!file) {
        const error = new Error('Please upload a file');
        error.httpStatusCode = 400;
        return next(error);
    }
    var file_upload_detail=[{status:"file uploaded",
        link_url:'upload/'+link}];
    res.json(file_upload_detail);

});


app.post("/compose", function(req, res) {

    var cell_department = req.body.cell_department;
    var cell_authority = req.body.cell_authority;
    var cell_name = req.body.cell_name;
    var G_department = req.body.G_department;
    var G_type = req.body.G_type;
    var G_Rto_name = req.body.G_Rto_name;
    var G_description = req.body.G_description;
    var gri_to_id;
    var G_type_id;
    var G_detail_id;
    var G_doc=req.body.G_doc;
    var gri_date = dt.format('Y-m-d');


    var sql1="SELECT cell_member_id FROM grievance_to " +
        "WHERE cell_member_name='"+cell_name+"' " +
        "AND cell_member_dept_id IN (SELECT dept_id FROM department WHERE dept_name='"+cell_department+"') " +
        "AND cell_member_desig_id IN (SELECT desig_id FROM designation WHERE desig_name='"+cell_authority+"');";

    connection.query(sql1, function (err, result1) {
        if (err){
            console.log(err);
        }
        else{
        console.log(result1);
        gri_to_id=result1[0].cell_member_id;
        }




    var sql2="SELECT grivance_type_id FROM grivance_type WHERE gtype='"+G_type+"'";

    connection.query(sql2, function (err, result2) {
        if (err){
            console.log(err);
        }
        console.log(result2);
        G_type_id=result2[0].grivance_type_id;




    var gri_by_id = req.session.user.user_id;

    var values1 = [
        [gri_date, G_type_id, G_description, G_doc, G_Rto_name, 'Pending', gri_to_id, gri_by_id, gri_to_id]
    ];

    console.log(values1);

    var sql3="INSERT INTO grievance_details (grievance_date, grievance_type, grievance_desc, grievance_files, grievance_related_to, grievance_status, apply_to, grievance_by_id, gri_holder) VALUES ?";

    connection.query(sql3, [values1], function (err, result3) {
        if (err){
            console.log(err);
        }
        console.log(result3.affectedRows + " record(s) grievance reported");


    var sql4="SELECT grievance_details_id FROM grievance_details " +
        "WHERE grievance_date='"+gri_date+"' " +
        "AND grievance_type='"+G_type_id+"' " +
        "AND grievance_desc='"+G_description+"' " +
        "AND grievance_related_to='"+G_Rto_name+"' " +
        "AND apply_to='"+gri_to_id+"' " +
        "AND grievance_by_id='"+gri_by_id+"'";

    connection.query(sql4, function (err, result4) {
        if (err){
            console.log(err);
        }
        console.log(result4);
        G_detail_id=result4[0].grievance_details_id;


    var values2 = [
        [gri_date, gri_to_id, G_detail_id]
    ];

    var sql5="INSERT INTO grievance (grievance_u_date, grievance_holder, grievance_details_id) VALUES ?";
    connection.query(sql5, [values2], function (err, result5) {
        if (err){
            console.log(err);
        }
        console.log(result5.affectedRows + " record(s) grievance recorded");


    });
    });
    });
    });
    });
});






app.post("/status_table", function(req, res){

    var gri_by_id = req.session.user.user_id;

    var sql = "SELECT A.grievance_details_id, C.cell_member_name, A.grievance_date, A.grievance_status " +
        "FROM grievance_details AS A, grievance AS B, grievance_to AS C " +
        "WHERE A.grievance_details_id=B.grievance_details_id " +
        "AND A.apply_to=C.cell_member_id " +
        "AND A.grievance_by_id="+gri_by_id;

    connection.query(sql, function (err, result) {
        if (err){
            console.log(err);
        }
        //console.log(result);
        res.json(result);

    });
});

app.post("/gri_detail", function(req, res) {

    var gri_detail_id = req.body.g_id;

    var sql = "SELECT C.cell_member_name AS cell_member_name, D.gtype AS gtype, A.grievance_related_to AS grievance_related_to, A.grievance_desc AS grievance_desc,A.grievance_status " +
        "FROM grievance_details AS A, grievance_to AS C, grivance_type AS D " +
        "WHERE C.cell_member_id=A.apply_to " +
        "AND D.grivance_type_id=A.grievance_type " +
        "AND A.grievance_details_id=" + gri_detail_id;

    connection.query(sql, function (err, result) {
        if (err) {
            console.log(err);
        }
        //console.log(result);

        var sql1 = "SELECT COUNT(resp_id) AS count FROM student_gs.resp_to_grievance " +
            "WHERE grievance_id=" + gri_detail_id;

        connection.query(sql1, function (err, result1) {
            if (err) {
                console.log(err);
            }

            var total = [];
            total.push(result);
            total.push(result1);
            res.json(total);

        });
    });

});



app.post("/reps_detail_to_student",function(req,res,next){

    var gri_detail_id = req.body.g_id;

    var sql="SELECT A.resp_text, A.resp_evidence, B.cell_member_name,A.resp_date " +
        "FROM resp_to_grievance AS A, grievance_to AS B " +
        "WHERE grievance_id=" + gri_detail_id +  " " +
        "AND A.resp_by=B.cell_member_id " +
        "ORDER BY resp_date DESC";

    connection.query(sql, function (err, result) {
        if (err) {
            console.log(err);
        }

        res.json(result);

    });

});





app.get('/logout', function(req, res, next) {

    if (req.session) {

        // delete session object
        req.session.destroy(function(err) {
            if(err) {
                 console.log(err);
            } else {
                console.log("successfully logout");
                res.redirect('/');
            }
        });
    }
});


app.post("/student_edit_prof",function(req,res,next){

    var stu_id = req.session.user.user_id;

    sql="select A.std_id,A.std_name,A.dob,B.dept_name,A.mobile_no,A.std_year,A.std_email_id,C.pass "+
        "from grievance_by as A,department as B,login as C "+
        "where A.std_dept_id=B.dept_id "+
        "and C.user_id=A.std_id "+
        "and A.std_id="+stu_id;


    connection.query(sql,function(err,result)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.json(result);
        }
    });
});



app.post("/user_id",function(req,res,next){
    var stu_name=req.body.fName;
    sql="select std_name "+
        "from grievance_by as A,login as B "+
        "where B.user_id="+stu_name;
    connection.query(sql,function(err,result)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            console.log("Yuu are......");
            res.json(result);
        }
    });
});






//Cell Member---------------------------------------------------------------------------------------




app.post('/cell_view_table',function(req,res,next){
    //console.log(req.body);

    var gri_by_id = req.session.user.user_id;

    var sql = "SELECT A.grievance_details_id, A.grievance_u_date, C.gtype, B.grievance_related_to " +
        "FROM grievance AS A,grievance_details AS B,grivance_type AS C " +
        "WHERE B.grievance_status='Pending' " +
        "AND B.grievance_type=C.grivance_type_id " +
        "AND A.grievance_details_id=B.grievance_details_id " +
        "AND B.gri_holder=" + gri_by_id;

    connection.query(sql, function (err, result) {
        if (err){
            console.log(err);
        }
        //console.log(result);
        res.json(result);

    });

});
app.post("/cell_replied_gr",function(req,res)
{
    var cell_member_id = req.session.user.user_id;

    sql="SELECT  C.grievance_details_id,B.gtype,A.grievance_u_date,C.grievance_status "+
        "FROM grievance as A,grivance_type as B,grievance_details AS C,resp_to_grievance AS D " +
        "WHERE C.grievance_details_id=D.grievance_id " +
        "AND C.grievance_type=B.grivance_type_id " +
        "AND A.grievance_details_id=C.grievance_details_id " +
        "AND C.grievance_status!='Pending' " +
        "AND D.resp_by="+cell_member_id;
    connection.query(sql,function(err,result)
    {
        if(err)
        {
            console.log("err");
        }
        else
        {
            console.log("sent");
            console.log(result);
            res.json(result);
        }
    });
});

app.post("/cell_reply",function(req,res,next){

    var gri_id = req.body.g_id;

    sql="SELECT  A.grievance_related_to,B.std_name,A.grievance_desc " +
        "FROM grievance_details as A,grievance_by as B " +
        "WHERE A.grievance_details_id=" + gri_id + " " +
        "AND A.grievance_by_id=B.std_id";

    connection.query(sql,function(err,result)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            //console.log(result);
            res.json(result);
        }
    });
});


app.post("/cell_member_edit_view",function(req,res,next){

    var cell_member_id = req.session.user.user_id;

    sql="SELECT A.cell_member_id,A.cell_member_name,C.dept_name,B.desig_name,A.cell_member_email_id,A.cell_member_mob_no,D.pass " +
    "FROM grievance_to AS A,designation AS B,department AS C,login AS D " +
    "WHERE A.cell_member_dept_id=C.dept_id " +
    "AND A.cell_member_desig_id=B.desig_id " +
    "AND A.cell_member_id=D.user_id " +
    "AND A.cell_member_id="+cell_member_id;

    connection.query(sql,function(err,result)
    {
        if(err)
        {
            console.log("err");
        }
        else
        {
            res.json(result);
        }
    });
});


app.post("/cell_member_prof_edit",function(req,res,next){

    var user_id = req.session.user.user_id;
    var  cell_member_id=req.body.cell_member_id,
    cell_member_name=req.body.cell_member_name,
    desig_name=req.body.desig_name,
    dept_name=req.body.dept_name,
    cell_member_mob_no=req.body.cell_member_mob_no,
    cell_member_email_id=req.body.cell_member_email_id,
    cell_member_pass=req.body.cell_member_pass;

var value=[[]];


    sql="UPDATE grievance_to " +
        "SET cell_member_name = 'Dr. P. V. Vijasfy Babu', cell_member_email_id = 'sdd' " +
        "WHERE (cell_member_id = '101')";

    connection.query(sql,function(err,result)
    {
        if(err)
        {
            console.log("err");
        }
        else
        {

        }
    });

});



app.post('/cell_file_upload', upload.single('file'), function (req, res, next) {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    const file = req.file;
    var link=req.file.filename;

    //console.log(file);
    if (!file) {
        const error = new Error('Please upload a file');
        error.httpStatusCode = 400;
        return next(error);
    }
    var file_upload_detail=[{status:"file uploaded",
        link_url:'upload/'+link}];
    res.json(file_upload_detail);

});

app.post("/reply_to_grievance",function(req,res,next) {

    var cell_desc=req.body.desc,
        doc_url=req.body.file_url,
        gri_id=req.body.gri_id;
    var cell_member_id = req.session.user.user_id;
    var rep_date = dt.format('Y-m-d');

    var sql="INSERT INTO `resp_to_grievance` " +
        "(`resp_by`, `grievance_id`, `resp_date`, `resp_text`, `resp_evidence`) VALUES ?";

    var values=[[cell_member_id, gri_id, rep_date, cell_desc, doc_url]];

    connection.query(sql, [values], function (err, result) {
        if (err){
            console.log(err);
        }
        console.log(result.affectedRows + " record(s) grievance recorded");
    });

    var sql1="UPDATE grievance_details SET grievance_status = 'Responded' WHERE (grievance_details_id = "+gri_id+")";

    connection.query(sql1, function (err, result) {
        if (err){
            console.log(err);
        }

        console.log("status updated to responded");

    });


});



//Cell Member----------------------------------------------------------------------------------------
//admin----------------------------------------------------------------------------------------
app.post("/admin_edit_view",function(req,res){
    sql=""

    connection.query(sql1, function (err, result) {
        if (err){
            console.log(err);
        }

        console.log("status updated to responded");

    });
});
//admin end----------------------------------------------------------------------------------------

app.listen(3000);
console.log("server is listening on port  no n:3000");
