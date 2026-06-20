import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Relationships',
        'Career',
        'Health',
        'Finance',
        'Personal Growth',
        'Spirituality',
        'Education',
        'Parenting',
        'Leadership',
        'Creativity',
        'Other',
      ],
    },
    emotionalTone: {
      type: String,
      required: [true, 'Emotional tone is required'],
      enum: [
        'Inspiring',
        'Reflective',
        'Humorous',
        'Heartwarming',
        'Motivational',
        'Calm',
        'Powerful',
        'Vulnerable',
      ],
    },
    image: {
      type: String,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    accessLevel: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    favoritesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creatorName: {
      type: String,
      required: true,
    },
    creatorEmail: {
      type: String,
      required: true,
    },
    creatorPhoto: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ title: 'text', description: 'text' });
lessonSchema.index({ category: 1, emotionalTone: 1 });
lessonSchema.index({ creatorId: 1 });
lessonSchema.index({ visibility: 1, accessLevel: 1 });
lessonSchema.index({ isFeatured: 1 });
lessonSchema.index({ createdAt: -1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
