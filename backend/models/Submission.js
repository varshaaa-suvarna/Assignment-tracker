const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    studentEmail: {
      type: String,
      required: [true, 'Student email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    content: {
      type: String,
      required: [true, 'Submission content is required'],
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate submissions: one per student per assignment
submissionSchema.index({ assignment: 1, studentEmail: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
