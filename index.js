const express = require('express');
const mongoose = require('mongoose');
const dbConnect = require('./dbConnect');
const User = require('./models/userModel');
const Presentation = require('./models/presentationModel');
const app = express();

dbConnect();
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

app.use(express.json());

app.get('/', function (req, res) {
  res.send('Hello');
});

app.post('/login', async function (req, res) {
  try {
    let user = await User.findOne(req.body);
    if (!user) {
      user = new User(req.body);
      await user.save();
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.post('/crtPresentation', async function (req, res) {
  const { title, ownerId } = req.body;
  try {
    const user = await User.findById(ownerId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const newPresentation = new Presentation({
      title,
      owner: ownerId,
      slides: [{ content: 'Contenido de la primera diapositiva' }],
    });
    await newPresentation.save();
    user.presentations.push(newPresentation._id);
    await user.save();
    res.status(200).json(newPresentation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
