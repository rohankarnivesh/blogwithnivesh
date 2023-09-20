const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
require('dotenv').config({path: '.env'})
// const fileUpload = require('express-fileupload');
// const cloudinary = require('cloudinary').v2;




const salt = bcrypt.genSaltSync(10);
const secret = 'asdv45e74h5gfh31asd';

app.use(cors({credentials:true, origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));


mongoose.connect(process.env.MONGO_URL);

app.post('/register', async (req, res) =>{
    const {username, password} = req.body;
    try{
        const userDoc = await User.create({
            username,
            password:bcrypt.hashSync(password, salt),
        });
        res.json(userDoc);
    }catch(e){
        res.status(400).json(e);
    }
    
});

app.post('/login', async (req, res) =>{
    const {username, password} = req.body;
    const userDoc = await User.findOne({username});
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if(passOk){
        jwt.sign({username, id:userDoc._id}, secret, {}, (err, token) => {
            if(err) throw err;
            res.cookie('token', token).json({
                id:userDoc._id,
                username,
            });
        });
    } else{
        res.status(400).json('wrong credentials');
    }
});

app.get('/profile', (req, res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err, info) =>{
        if(err) throw err;
        res.json(info);
    });
});

app.post('/logout', (req,res) => {
    res.cookie('token', '').json('ok');
})
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    const {originalname, path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);

    const {token} = req.cookies;
    jwt.verify(token, secret, {},async (err, info) =>{
        if(err) throw err;
        const {title, summary, content} = req.body;
        const postDoc = await Post.create({
        title,
        summary,
        content,
        cover:newPath,
        author: info.id,
        });
    res.json(postDoc);
 });
});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    try {
        // Handle file uploads and renaming here

        const { token } = req.cookies;
        jwt.verify(token, secret, {}, async (err, info) => {
            if (err) {
                throw err;
            }
            const { id, title, summary, content } = req.body;
            const post = await Post.findById(id);

            if (!post) {
                res.status(404).json({ error: 'Post not found' });
                return;
            }

            // Check if the user is the author of the post
            if (post.author.toString() !== info.id) {
                res.status(403).json({ error: 'You are not the author of this post' });
                return;
            }

            // Update the post
            await Post.findOneAndUpdate(
                { _id: id },
                {
                    title,
                    summary,
                    content,
                    cover: newPath ? newPath : post.cover,
                }
            );

            // Fetch the updated post and send it as a response
            const updatedPost = await Post.findById(id).populate('author', ['username']);
            res.json(updatedPost);
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.get('/post', async (req, res) => {
    res.json(
        await Post.find()
        .populate('author', ['username'])
        .sort({createdAt: -1})
        .limit(20)    
    );
});

app.get('/post/:id', async(req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
});

app.listen(4000);