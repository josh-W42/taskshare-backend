require('dotenv').config();
const mongoose = require('mongoose');

// Better Practice to hid the mongo url
const url = process.env.MONGO_URL || 'mongodb://localhost:27017/taskshareDev';
const configOptions = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
};

mongoose.connect(url, configOptions)
    .then(() => console.log('MongoDB successfully connected...'))
    .catch(err => console.log('MongoDB connection error:', err));

module.exports = {
    User: require('./user'),
    Workspace: require('./workspace'),
    Member: require('./member'),
    Room: require('./room'),
    Post: require('./post'),
    Comment: require('./comment'),
    Task: require('./task'),
    Reaction: require('./reaction'),
}