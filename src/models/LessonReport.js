import mongoose from 'mongoose';

const lessonReportSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
  },
  reporterUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reporterEmail: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Report reason is required'],
    trim: true,
    minlength: [5, 'Reason must be at least 5 characters'],
    maxlength: [500, 'Reason cannot exceed 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

lessonReportSchema.index({ lessonId: 1 });
lessonReportSchema.index({ reporterUserId: 1, lessonId: 1 }, { unique: true });

const LessonReport = mongoose.model('LessonReport', lessonReportSchema);

export default LessonReport;
