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

const stringParser = {
    useNewUrlParser: true
}
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
    _comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
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

app.post('/message', (request, response) => {
    const new_message = new Message(request.body);
    new_message.save(function(err){
        if(err){
            console.log(`there were errors: ${err}`);
            response.render('index', {errors: new_message.errors, title: 'Message page' });
        } else {
            console.log(`successfully created new message`)
            response.redirect('/');
        }
    });
});

app.get('/', (request, response) => {
    console.log(`getting the index route`);
    Message.find({}, false).populate('_comments').exec(function(err, messages){
            // console.log(`request.body info: ${request.body}`);
            // console.log(`messages: ${messages}`);
            response.render('index', {messages: messages, title: 'Welcome to the Message Board App' });
    });
});

// create new hop post action
app.post('/comment/:_id', (request, response) => {
    console.log("POST DATA", request.body);
    const message_id = request.params.id;
    console.log(`posting to the add new comment route`);
    Message.findOne({ _id:message_id }, (err, message) => {
        const new_comment = new Comment({ name: request.body.name, text: request.body.comment });
        new_comment._message = message_id;
        Message.update({ _id: message_id }, { $push: { _comments: new_comment }}, (err) => {

        });
        new_comment.save((err) => {
            if(err){
                console.log(`there were errors: ${err}`);
                response.render('index', { errors: new_comment.errors, title: 'Comments' });
            } else {
                console.log(`comment added inside of new_comment.save() function`);
                response.redirect('/');
            }
        });
    });
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