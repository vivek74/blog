var methodOverride = require("method-Override"),
mongoose =require("mongoose"),
express=require("express"),
passport=require("passport"),
bodyParser=require("body-parser"),
User=require("./models/user"),
Comment=require("./models/comment"),
LocalStrategy=require("passport-local"),
passportLocalMongoose=require("passport-local-mongoose"),
app=express();

           //database connection

mongoose.Promise = global.Promise;

//main password security
app.use(require("express-session")({
	secret:"Rusty is the best and cutest dog in the world",
	resave:false,
	saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

//takin data from session to decode and encode it---------
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());              //taking the data from the session decoded and uncode it
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser=res.user;
	next();
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("database conected!");
});

app.set("view engine","ejs");
app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride("_method"));

          //MONGOOSE/MODEL CONFIG
var blogSchema=new mongoose.Schema({
	title: String,
	image: String,
	body: String,
	comments:[
		{
			type: mongoose.Schema.Types.ObjectId,
			ref:"Comment"
		}
	],
	created: {type: Date, default: Date.now}
});
var Blog = mongoose.model("Blog", blogSchema);






           // Index page

app.get("/", function(req, res){
	res.redirect("/blogs");
})

app.get("/blogs",function(req,res){
	Blog.find({}, function(err, blogs){
		if(err){
			console.log("Error");
		} else {
			res.render("index",{blogs: blogs, currentUser: req.user});
		}
	});
});
//new route
app.get("/blogs/new",isLoggedIn,function(req,res){
	res.render("new");
})
//create route
app.post("/blogs",isLoggedIn,function(req,res){
	Blog.create(req.body.blog, function(err, newBlog){
		if(err){
			res.render("new");
		} else{
			res.redirect("/blogs");
		}
	});
});

// show routes

app.get("/blogs/:id", function(req, res){
	Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog){
		if(err){
			res.redirect("/blogs");
		} else {
			res.render("show",{blog: foundBlog, currentUser: req.user});
		}
	});
});

//edit route
app.get("/blogs/:id/edit", isLoggedIn,function(req, res){
	Blog.findById(req.params.id, function(err, foundBlog){
		if(err){
			res.redirect("/blogs");
		} else {
			res.render("edit",{blog: foundBlog});
		}
	});
});

//contact routes
app.get("/contact",function(req,res){
	res.render("contact");
});

//update route
app.put("/blogs/:id",isLoggedIn, function(req, res){
	Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updateBlog){
		if(err){
			res.redirect("/blogs");
		} else{
			res.redirect("/blogs/" + req.params.id);
		}
	});
});

//delete route
app.delete("/blogs/:id",isLoggedIn, function(req, res){
	//destroy blog
	Blog.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/blogs");
		} else {
			//redirect somewhere
			res.redirect("/blogs");
		}
	})
});


//comment post
app.post("/blogs/:id/comments", function(req, res){
	//lookup campground using ID
	Blog.findById(req.params.id, function(err, blog){
		if(err){
			res.redirect("/blogs");
		} else {
			Comment.create(req.body.comment,function(err, comment){
				if(err){
					console.log(err);
				} else {
					blog.comments.push(comment);
					blog.save();
					res.redirect('/blogs/' + blog._id);
				}
			});
		}
	});
	//create new comment
	//connect new comment to campground
	//redirect campground show page
})


//register user
//app.get("/register",function(req, res){
//	res.render("register");
//});
//handling user sign up

//app.post("/register",function(req, res){
//	req.body.username
//	req.body.password
//	User.register(new User({username:req.body.username}), req.body.password,function(err,user){
//		if(err){
//			console.log(err);
//			return res.render("register");
//		}
//		passport.authenticate("local")(req,res,function(){
//			res.redirect("blogs");
//		})
//	})
//});


//login routes

app.get("/login", function(req, res){
	res.render("login");
});
//login logic
app.post("/login",passport.authenticate("local",{
	successRedirect:"blogs",
	failureRedirect:"login"
}),function(req,res){
});

//logout
app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/");
});


//middleware
function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}


app.listen(3000,function(){
console.log("server started on 3000");
});