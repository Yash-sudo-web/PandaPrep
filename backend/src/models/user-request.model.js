import mongoose from 'mongoose';

const UserRequestSchema = new mongoose.Schema({
  // User ID
  _userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel'
  },
  // Basic information
  subject_name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot be more than 100 characters']
  },
  
  // Syllabus content
  syllabus: {
    type: String,
    required: [true, 'Syllabus content is required'],
    trim: true,
    minlength: [10, 'Syllabus content is too short']
  },
  
  // Note generation options
  note_type: {
    type: String,
    enum: {
      values: ['concise', 'detailed', 'q&a'],
      message: '{VALUE} is not a supported note type'
    },
    default: 'detailed',
    lowercase: true,
    trim: true
  },
  
  // Examples settings
  include_examples: {
    type: String,
    enum: {
      values: ['Yes', 'No'],
      message: 'Include examples must be either "Yes" or "No"'
    },
    default: 'No'
  },
  
  example_types: {
    type: [String],
    validate: {
      validator: function(types) {
        // Only validate if include_examples is "Yes"
        if (this.include_examples === 'No') return true;
        
        const validTypes = ['Real-world', 'Hypothetical', 'Historical'];
        return types.every(type => validTypes.includes(type));
      },
      message: 'Example types must be one of: Real-world, Hypothetical, Historical'
    },
    default: []
  },
  
  // Additional instructions
  user_instructions: {
    type: String,
    trim: true,
    maxlength: [500, 'User instructions cannot be more than 500 characters'],
    default: ''
  },
  
  // Output format preference
  format: {
    type: String,
    enum: {
      values: ['pdf', 'markdown'],
      message: '{VALUE} is not a supported output format'
    },
    default: 'pdf',
    lowercase: true
  },
  
  // Request metadata
  created_at: {
    type: Date,
    default: Date.now
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Processing metrics
  processing_time_ms: {
    type: Number,
    default: null
  },
  
  // Error information
  error: {
    message: String,
    details: String,
    occurred_at: Date
  },
  
  // Output reference
  output_file: {
    filename: String,
    path: String,
    size_bytes: Number,
    created_at: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
UserRequestSchema.index({ created_at: -1 });
UserRequestSchema.index({ status: 1 });
UserRequestSchema.index({ 'subject_name': 'text' });

// Virtual for determining if request is completed
UserRequestSchema.virtual('is_completed').get(function() {
  return ['completed', 'failed'].includes(this.status);
});

const NotesRequestModel = mongoose.model('UserRequest', UserRequestSchema);

module.exports = NotesRequestModel;