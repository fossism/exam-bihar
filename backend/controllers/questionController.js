const Question = require('../models/Question');

// @desc    Get questions for faculty's college
// @route   GET /api/questions
// @access  Private (Faculty, CollegeAdmin)
const getQuestions = async (req, res) => {
  const collegeId = req.user.collegeId;
  const { subject, difficulty, type } = req.query;

  try {
    let query = { collegeId };

    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;

    const questions = await Question.find(query).populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching questions' });
  }
};

// @desc    Get question by ID
// @route   GET /api/questions/:id
// @access  Private (Faculty, CollegeAdmin)
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    // Verify college context match
    if (question.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied: Question belongs to another college' });
    }
    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching question details' });
  }
};

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private (Faculty only)
const createQuestion = async (req, res) => {
  const { subject, topic, type, text, options, correctOption, difficulty, points, codingTestCases, codingTemplate } = req.body;

  try {
    const question = await Question.create({
      collegeId: req.user.collegeId,
      subject,
      topic,
      type: type || 'MCQ',
      text,
      options: type === 'MCQ' ? options : undefined,
      correctOption: type === 'MCQ' ? correctOption : undefined,
      codingTestCases: type === 'Coding' ? codingTestCases : undefined,
      codingTemplate: type === 'Coding' ? codingTemplate : undefined,
      difficulty: difficulty || 'Medium',
      points: points || 1,
      createdBy: req.user._id,
    });

    res.status(201).json(question);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error creating question', error: error.message });
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private (Faculty only)
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied: Question belongs to another college' });
    }

    const { subject, topic, type, text, options, correctOption, difficulty, points, codingTestCases, codingTemplate } = req.body;

    question.subject = subject || question.subject;
    question.topic = topic || question.topic;
    question.type = type || question.type;
    question.text = text || question.text;
    question.difficulty = difficulty || question.difficulty;
    question.points = points !== undefined ? points : question.points;

    if (type === 'MCQ') {
      question.options = options || question.options;
      question.correctOption = correctOption !== undefined ? correctOption : question.correctOption;
      question.codingTestCases = undefined;
      question.codingTemplate = undefined;
    } else if (type === 'Coding') {
      question.options = undefined;
      question.correctOption = undefined;
      question.codingTestCases = codingTestCases || question.codingTestCases;
      question.codingTemplate = codingTemplate || question.codingTemplate;
    } else {
      question.options = undefined;
      question.correctOption = undefined;
      question.codingTestCases = undefined;
      question.codingTemplate = undefined;
    }

    const updatedQuestion = await question.save();
    res.json(updatedQuestion);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error updating question', error: error.message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private (Faculty only)
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied: Question belongs to another college' });
    }

    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting question' });
  }
};

// @desc    Bulk Import Questions
// @route   POST /api/questions/bulk-import
// @access  Private (Faculty only)
const bulkImportQuestions = async (req, res) => {
  const { questions } = req.body; // Expecting an array of Question objects

  if (!questions || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Please provide an array of questions for import' });
  }

  try {
    const collegeId = req.user.collegeId;
    const createdBy = req.user._id;

    const questionsToInsert = questions.map((q) => ({
      ...q,
      collegeId,
      createdBy,
    }));

    const importedQuestions = await Question.insertMany(questionsToInsert);
    res.status(201).json({
      message: `${importedQuestions.length} questions imported successfully`,
      count: importedQuestions.length,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error during bulk import', error: error.message });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
};
