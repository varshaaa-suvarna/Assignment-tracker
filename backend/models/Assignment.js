const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: auto-determine status based on due date
assignmentSchema.methods.refreshStatus = function () {
  const now = new Date();
  if (now > this.dueDate) {
    this.status = 'closed';
  } else {
    this.status = 'active';
  }
  return this;
};

// Pre-save hook: set status based on due date
assignmentSchema.pre('save', function (next) {
  const now = new Date();
  this.status = now > this.dueDate ? 'closed' : 'active';
  next();
});

module.exports = mongoose.model('Assignment', assignmentSchema);
