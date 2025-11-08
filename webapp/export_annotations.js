/**
 * Export annotations from JSONL to CSV
 * Usage: node export_annotations.js
 */

const fs = require('fs');
const path = require('path');

const ANNOTATIONS_FILE = path.join(__dirname, 'annotations.jsonl');
const OUTPUT_FILE = path.join(__dirname, 'annotations_export.csv');

function exportAnnotations() {
    if (!fs.existsSync(ANNOTATIONS_FILE)) {
        console.log('No annotations file found.');
        return;
    }

    const content = fs.readFileSync(ANNOTATIONS_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line);

    if (lines.length === 0) {
        console.log('No annotations found.');
        return;
    }

    // Parse all annotations
    const annotations = [];
    for (const line of lines) {
        try {
            annotations.push(JSON.parse(line));
        } catch (e) {
            console.error('Error parsing line:', line);
        }
    }

    // Get unique filenames (keep only latest annotation per file)
    const latestAnnotations = new Map();
    for (const ann of annotations) {
        latestAnnotations.set(ann.filename, ann);
    }

    // CSV headers
    const headers = [
        'filename',
        'duration',
        'refCorrect',
        'modelCorrect',
        'idealTranscript',
        'properNoun',
        'accentVariation',
        'numericDate',
        'homophone',
        'foreignLanguage',
        'gender',
        'backgroundNoise',
        'audioQuality',
        'notes',
        'annotator',
        'timestamp'
    ];

    // Create CSV content
    let csv = headers.join(',') + '\n';

    for (const ann of latestAnnotations.values()) {
        const row = headers.map(header => {
            let value = ann[header] || '';
            // Escape quotes and wrap in quotes if contains comma or quote
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csv += row.join(',') + '\n';
    }

    // Write CSV file
    fs.writeFileSync(OUTPUT_FILE, csv, 'utf-8');

    console.log(`\nAnnotation Export Complete`);
    console.log(`========================`);
    console.log(`Total annotations: ${annotations.length}`);
    console.log(`Unique files: ${latestAnnotations.size}`);
    console.log(`Output file: ${OUTPUT_FILE}`);
    console.log(`\nSummary by annotator:`);

    // Count by annotator
    const byAnnotator = {};
    for (const ann of latestAnnotations.values()) {
        byAnnotator[ann.annotator] = (byAnnotator[ann.annotator] || 0) + 1;
    }

    for (const [annotator, count] of Object.entries(byAnnotator)) {
        console.log(`  ${annotator}: ${count} files`);
    }
}

exportAnnotations();
