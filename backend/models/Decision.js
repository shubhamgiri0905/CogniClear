const mongoose = require('mongoose');

const decisionSchema = new mongoose.Schema({
    _id: {
        type: String, // Overwrite default ObjectId to support UUIDs from frontend
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    context: {
        type: String,
        required: true
    },
    emotions: {
        type: [String],
        default: []
    },
    optionsConsidered: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['DRAFT', 'ANALYZED', 'COMPLETED'],
        default: 'DRAFT'
    },
    finalChoice: {
        type: String
    },
    outcome: {
        type: String
    },
    analysis: {
        summary: String,
        biases: [{
            name: String,
            description: String,
            probability: Number,
            mitigation: String
        }],
        blindSpots: [String],
        alternativePerspectives: [String],
        simulations: [{
            scenario: String,
            outcome: String,
            riskLevel: String
        }],
        clarityScore: Number,
        relatedTags: [String]
    },
    outcomeAnalysis: {
        causalReflection: String,
        biasValidation: String,
        learningPoint: String,
        updatedClarityScore: Number
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
        }
    }
});

module.exports = mongoose.model('Decision', decisionSchema);
