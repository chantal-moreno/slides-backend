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
// Get presentation
app.get('/presentations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const presentation = await Presentation.findById(id).populate(
      'owner',
      'nickname'
    );
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    res.status(200).json(presentation);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la presentación' });
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
    res.status(500).json({ error: 'Error to get presentations' });
  }
});

// Get all the slides of a presentation
app.get('/presentations/:id/slides', async (req, res) => {
  const { id } = req.params;
  try {
    const presentation = await Presentation.findById(id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    res.status(200).json(presentation.slides);
  } catch (error) {
    res.status(500).json({ error: 'Error to get slides' });
  }
});

// Add slide to presentation (only presentation owner)
app.post('/presentations/:id/slides', async (req, res) => {
  const { id } = req.params;
  const { content, userId } = req.body;

  try {
    const presentation = await Presentation.findById(id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    if (presentation.owner.toString() !== userId) {
      return res.status(403).json({
        error: 'Error NOT permission to add a slide',
      });
    }

    presentation.slides.push({ content });
    presentation.lastModified = Date.now();
    await presentation.save();

    res.status(200).json({ message: 'Slide add succesfully', presentation });
  } catch (error) {
    res.status(500).json({ error: 'Error to add slide' });
  }
});

// Delete slide (only presentation owner)
app.delete(
  '/presentations/:presentationId/slides/:slideId',
  async (req, res) => {
    const { presentationId, slideId } = req.params;
    const { userId } = req.body;

    try {
      const presentation = await Presentation.findById(presentationId);
      if (!presentation) {
        return res.status(404).json({ error: 'Presentation not found' });
      }
      if (presentation.owner.toString() !== userId) {
        return res.status(403).json({
          error: 'Error NOT permission to delete slide',
        });
      }

      const slideIndex = presentation.slides.findIndex(
        (slide) => slide._id.toString() === slideId
      );
      if (slideIndex === -1) {
        return res.status(404).json({ error: 'Slide not found' });
      }

      presentation.slides.splice(slideIndex, 1);
      presentation.lastModified = Date.now();
      await presentation.save();

      res
        .status(200)
        .json({ message: 'Slide deleted successfully', presentation });
    } catch (error) {
      res.status(500).json({ error: 'Error to delete slide' });
    }
  }
);

// Add new editor (only the owner can add new editors)
app.post('/presentations/:id/add-editor', async (req, res) => {
  const { id } = req.params;
  const { ownerId, newEditorId } = req.body;

  try {
    const presentation = await Presentation.findById(id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    if (presentation.owner !== ownerId) {
      return res.status(403).json({ error: 'Only the owner can add editors' });
    }

    const alreadyEditor = presentation.editors.some(
      (editor) => editor.editorId === newEditorId
    );
    if (alreadyEditor) {
      return res.status(400).json({ error: 'This user is already an editor' });
    }

    presentation.editors.push({ editorId: newEditorId });

    await presentation.save();

    res
      .status(200)
      .json({ message: 'Editor added successfully', presentation });
  } catch (error) {
    res.status(500).json({ error: 'Error to add editor' });
  }
});

// Delete editor (only owner)
app.delete('/presentations/:id/remove-editor', async (req, res) => {
  const { id } = req.params;
  const { ownerId, editorId } = req.body;
  try {
    const presentation = await Presentation.findById(id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    if (presentation.owner !== ownerId) {
      return res
        .status(403)
        .json({ error: 'Only the owner can delete editors' });
    }
    const editorIndex = presentation.editors.findIndex(
      (editor) => editor.editorId === editorId
    );

    if (editorIndex === -1) {
      return res.status(404).json({ error: 'This user is no an editor' });
    }

    presentation.editors.splice(editorIndex, 1);

    await presentation.save();

    res
      .status(200)
      .json({ message: 'Editor deleted successfully', presentation });
  } catch (error) {
    res.status(500).json({ error: 'Error to delete editor' });
  }
});
