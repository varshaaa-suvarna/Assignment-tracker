const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// Helper: refresh status of all assignments against current time
async function refreshAllStatuses() {
  await Assignment.updateMany(
    { dueDate: { $lte: new Date() }, status: 'active' },
    { $set: { status: 'closed' } }
  );
}

/**
 * POST /api/assignments
 * Create a new assignment
 */
router.post('/', async (req, res) => {
  try {
    const { title, subject, description, dueDate, instructor } = req.body;

    // Validation
    if (!title || !subject || !description || !dueDate || !instructor) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'title, subject, description, dueDate, and instructor are required',
      });
    }

    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ error: 'Invalid dueDate format' });
    }

    const assignment = new Assignment({ title, subject, description, dueDate: parsedDate, instructor });
    await assignment.save();

    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment', details: err.message });
  }
});

/**
 * GET /api/assignments
 * Retrieve all assignments (supports ?status= and ?subject= filters, ?sort=dueDate, ?search=)
 */
router.get('/', async (req, res) => {
  try {
    await refreshAllStatuses();

    const { status, subject, sort, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { instructor: new RegExp(search, 'i') },
      ];
    }

    let query = Assignment.find(filter);
    if (sort === 'dueDate') query = query.sort({ dueDate: 1 });
    else query = query.sort({ createdAt: -1 });

    const assignments = await query;
    res.json({ count: assignments.length, assignments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments', details: err.message });
  }
});

/**
 * GET /api/assignments/:id
 * Retrieve a specific assignment
 */
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    await refreshAllStatuses();
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    res.json({ assignment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignment', details: err.message });
  }
});

/**
 * PUT /api/assignments/:id
 * Update an assignment
 */
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const { title, subject, description, dueDate, instructor } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (subject) updateData.subject = subject;
    if (description) updateData.description = description;
    if (instructor) updateData.instructor = instructor;
    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate)) return res.status(400).json({ error: 'Invalid dueDate format' });
      updateData.dueDate = parsedDate;
      updateData.status = new Date() > parsedDate ? 'closed' : 'active';
    }

    const assignment = await Assignment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    res.json({ message: 'Assignment updated successfully', assignment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update assignment', details: err.message });
  }
});

/**
 * DELETE /api/assignments/:id
 * Delete an assignment and its submissions
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Also delete linked submissions
    await Submission.deleteMany({ assignment: req.params.id });

    res.json({ message: 'Assignment and its submissions deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete assignment', details: err.message });
  }
});

module.exports = router;
