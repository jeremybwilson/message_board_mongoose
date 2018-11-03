const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const parser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const {Schema} = mongoose;

const port = process.env.PORT || 8000;
// invoke express and store the result in the variable app
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'static')));
app.set('views', path.join(__dirname, 'views'));

app.use(parser.urlencoded({ extended: true }));
app.use(parser.json());
app.use(flash());
app.use(session({
    secret:'superSekretKitteh',
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false, maxAge: 60000}
}));

// mongodb connection
mongoose.connect('mongodb://localhost:27017/message_board_db', { useNewUrlParser: true });
mongoose.connection.on('connected', () => console.log('MongoDB connected'));

// schema
const MessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A name is required'],
        minlength: 3,
        trim: true
    },
    message: {
        type: String,
        required: [true, 'A message is required'],
        minlength: 2,
        trim: true
    },
    comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
    }, {timestamps: true});
mongoose.model('Message', MessageSchema); // We are setting this Schema in our Models as 'Message'

const CommentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A name is required'],
        minlength: 3,
        trim: true
    },
    comment: {
        type: String,
        required: [true, 'A comment is required'],
        minlength: 3,
        trim: true
    },
    _message: {type: Schema.Types.ObjectId, ref: 'Message'},
}, {timestamps: true});
mongoose.model('Comment', CommentSchema); // We are setting this Schema in our Models as 'User'

const Message = mongoose.model('Message', MessageSchema) // We are retrieving this Schema from our Models, named 'Message'
const Comment = mongoose.model('Comment', CommentSchema) // We are retrieving this Schema from our Models, named 'Comment'

app.listen(port, () => console.log(`Express server listening on port ${port}`));

//routing
    //root route - display all

app.post('/new_message', (request, response) => {
    const new_message = new Message(request.body);
    new_message.save(function(err){
        if(err){
            response.json(err);
        } else {
            response.redirect('/');
        }
    })
});

app.get('/', (request, response) => {
    console.log(`getting the index route`);
    Message.find({}).populate('comments').exec(function(err, messages){
        if(err){
            response.json(err);
        } else {
            console.log(`request.body info: ${request.body}`);
            console.log(`messages: ${messages}`);
            response.render('index', {messages: messages, title: 'Welcome to the Message Board App'})
        }
    });
});

// create new hop post action
app.post('/new_comment/:_id', (request, response) => {
    console.log("POST DATA", request.body);
    // This is where we would add the hop plant entry from request.body to the db.
    // Create a new Hop with the hop name, origin, type, and description, and alpha values corresponding to those from request.body
    const which = request.params._id;
    console.log(`posting to the add new comment route`);
    Message.findOne({_id:which}, function(err, message){
        if(err){
            response.json(err);
        } else {
            const new_comment = new Schema({
                _message: which,
                name: request.body.name,
                comment: request.body.comment
            });
            new_comment = save(function(err){
                if(err){
                    response.json(err);
                } else {
                    message.save(function(err){
                        if(err){
                            response.json(err);
                        } else {
                            response.redirect('/')
                        }
                    });
                }
            });
        }
    });
});

// post edits/updates to individual hop 
// app.post('/new_comment/:_id', (request, response) => {
//     const which = request.params._id;
//     // console.log(`posting to an individual hop route`);
//     // which represents id value, request.body represents all information passed from the form, 
//     // {new: true} object represents a brand new value
//     Message.findByIdAndUpdate(which, request.body, {new: true}) 
//         .then((message) => {
//             console.log(`successfully added new comment!`);
//             response.redirect('/');
//         })
//         .catch(error => {
//             for (let key in error.errors) {
//                 request.flash('create_error', error.errors[key].message);
//             }
//             console.log(`something went wrong in the hops update/post route, ${error.errors[key].message}`);
//             response.redirect(`/new_comment/${which}`);
//         });
// });

app.get('/new_comment/destroy/:_id', (request,response) => {
    const which = request.params._id;
    Message.remove({_id:which})
        .then(() => {
            console.log('deleted successfully')
            response.redirect('/');
        })
        .catch((error) => console.log(error));
            response.redirect('/');

});

// catch 404 and forward to error handler
app.use((request, response, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, request, response, next) => {
    // set locals, only providing error in development
    response.locals.message = err.message;
    response.locals.error = request.app.get('env') === 'development' ? err : {};
    response.status(err.status || 500);
    // render the error page
    response.render('error', {title: 'Error page'});
  });

// app.listen(port, () => console.log(`Express server listening on port ${port}`));    // ES6 way