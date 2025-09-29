"use strict";
/**
 * Narrative Generation Module
 * Provides templates and functions for generating narrative insights
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.narrativeTemplates = void 0;
exports.generateNarrative = generateNarrative;
exports.narrativeTemplates = {
    financial_health: {
        pattern: 'financial_health',
        template: 'Financial health analysis shows {metrics} with {trend} trend.',
        variables: ['metrics', 'trend']
    },
    variance_analysis: {
        pattern: 'variance_analysis',
        template: 'Budget variance analysis reveals {variance}% difference from planned values.',
        variables: ['variance']
    },
    trend_analysis: {
        pattern: 'trend_analysis',
        template: '{metric} shows a {direction} trend with {confidence}% confidence.',
        variables: ['metric', 'direction', 'confidence']
    }
};
function generateNarrative(template, variables) {
    var narrative = template.template;
    template.variables.forEach(function (variable) {
        var value = variables[variable];
        narrative = narrative.replace("{".concat(variable, "}"), (value === null || value === void 0 ? void 0 : value.toString()) || '');
    });
    return narrative;
}
