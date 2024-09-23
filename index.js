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
// Enter user nickname
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
// Create presentation
app.post('/presentation', async function (req, res) {
  const { title, ownerId } = req.body;
  try {
    const user = await User.findById(ownerId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const newPresentation = new Presentation({
      title,
      owner: ownerId,
      slides: [{ content: 'First slide content' }],
    });
    await newPresentation.save();
    user.presentations.push(newPresentation._id);
    await user.save();
    res.status(200).json(newPresentation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Delete presentation
app.delete('/presentations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const presentation = await Presentation.findById(id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    await Presentation.findByIdAndDelete(id);
    // Delete presentation from user presentations array
    await User.findByIdAndUpdate(presentation.owner, {
      $pull: { presentations: id },
    });
    res.status(200).json({ message: 'Presentation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting the presentation' });
  }
});

// Get user presentations
app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('presentations');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error to get the user' });
  }
});

// Get all the presentations except user presentations
app.get('/presentations/exclude/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const presentations = await Presentation.find({ owner: { $ne: userId } });

    res.status(200).json(presentations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las presentaciones' });
  }
});
