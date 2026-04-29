const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

/**
 * POST /api/assignments/:id/submit
 * Submit an assignment
 */
router.post('/:id/submit', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Refresh status based on current time
    const now = new Date();
    if (now > assignment.dueDate) {
      assignment.status = 'closed';
      await assignment.save();
      return res.status(400).json({
        error: 'Submission rejected',
        message: 'The deadline for this assignment has passed.',
      });
    }

    if (assignment.status !== 'active') {
      return res.status(400).json({
        error: 'Submission rejected',
        message: 'Submissions are only allowed when the assignment is active.',
      });
    }

    const { studentName, studentEmail, content } = req.body;

    if (!studentName || !studentEmail || !content) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'studentName, studentEmail, and content are required',
      });
    }

    // Check for duplicate submission
    const existing = await Submission.findOne({ assignment: req.params.id, studentEmail });
    if (existing) {
      return res.status(409).json({
        error: 'Duplicate submission',
        message: 'You have already submitted this assignment.',
      });
    }

    const submission = new Submission({
      assignment: req.params.id,
      studentName,
      studentEmail,
      content,
    });

    await submission.save();

    // Increment submission count
    assignment.submissionCount += 1;
    await assignment.save();

    res.status(201).json({ message: 'Submission successful', submission });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Duplicate submission',
        message: 'You have already submitted this assignment.',
      });
    }
    res.status(500).json({ error: 'Failed to submit', details: err.message });
  }
});

/**
 * GET /api/assignments/:id/submissions
 * Get all submissions for a specific assignment
 */
router.get('/:id/submissions', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const submissions = await Submission.find({ assignment: req.params.id }).sort({ submittedAt: -1 });

    res.json({
      assignment: { id: assignment._id, title: assignment.title, status: assignment.status },
      submissionCount: submissions.length,
      submissions,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions', details: err.message });
  }
});

module.exports = router;
