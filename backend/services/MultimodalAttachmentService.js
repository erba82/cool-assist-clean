'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const DxfParser = require('dxf-parser');
const { createWorker } = require('tesseract.js');

const MAX_BYTES = 40 * 1024 * 1024;
const TEXT_TYPES = new Set(['text/plain', 'text/markdown', 'text/csv', 'application/json']);
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4']);
const DOC_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/dxf', 'image/vnd.dxf'
]);

const cleanName = (name) => String(name || 'attachment').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'attachment';
const truncate = (value, size = 12000) => String(value || '').replace(/\u0000/g, '').slice(0, size);

class MultimodalAttachmentService {
    constructor({ uploadDirectory = path.resolve(__dirname, '../runtime/uploads') } = {}) {
        this.uploadDirectory = uploadDirectory;
    }

    supportedTypes() {
        return {
            maxBytes: MAX_BYTES,
            text: [...TEXT_TYPES],
            documents: [...DOC_TYPES],
            images: [...IMAGE_TYPES],
            mediaAcceptedForReview: [...VIDEO_TYPES, ...AUDIO_TYPES],
            note: 'Images receive OCR. Video/audio are securely stored as review-required until a configured transcription or vision provider is available. Files never change design rules automatically.'
        };
    }

    async analyze(payload) {
        const fileName = cleanName(payload?.fileName);
        const mimeType = String(payload?.mimeType || 'application/octet-stream').toLowerCase();
        const encoded = String(payload?.base64 || '').replace(/^data:[^;]+;base64,/, '');
        if (!encoded) throw new Error('Attachment base64 content is required.');
        const buffer = Buffer.from(encoded, 'base64');
        if (!buffer.length) throw new Error('Attachment content is empty.');
        if (buffer.length > MAX_BYTES) throw new Error(`Attachment exceeds the ${MAX_BYTES / 1024 / 1024} MB analysis limit.`);

        await fs.mkdir(this.uploadDirectory, { recursive: true });
        const id = crypto.randomUUID();
        const storageName = `${id}-${fileName}`;
        const filePath = path.join(this.uploadDirectory, storageName);
        await fs.writeFile(filePath, buffer, { flag: 'wx' });

        const attachment = { id, fileName, mimeType, sizeBytes: buffer.length, stored: true, analysisStatus: 'review-required' };
        let analysis;
        if (TEXT_TYPES.has(mimeType)) {
            const text = truncate(buffer.toString('utf8'));
            analysis = { kind: 'text', status: 'extracted', text, contentForAI: text, reviewRequired: true };
        } else if (mimeType === 'application/pdf') {
            const parsed = await pdf(buffer);
            const text = truncate(parsed.text);
            analysis = { kind: 'pdf', status: 'extracted', pageCount: parsed.numpages || null, text, contentForAI: text, reviewRequired: true };
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const parsed = await mammoth.extractRawText({ buffer });
            const text = truncate(parsed.value);
            analysis = { kind: 'docx', status: 'extracted', text, contentForAI: text, reviewRequired: true };
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType === 'application/vnd.ms-excel') {
            const workbook = XLSX.read(buffer, { type: 'buffer', cellText: true, cellDates: false });
            const sheets = workbook.SheetNames.slice(0, 8).map((name) => ({ name, preview: truncate(XLSX.utils.sheet_to_csv(workbook.Sheets[name]), 3000) }));
            analysis = { kind: 'spreadsheet', status: 'extracted', sheets, contentForAI: sheets.map((item) => `Sheet: ${item.name}\n${item.preview}`).join('\n\n'), reviewRequired: true };
        } else if (mimeType === 'application/dxf' || mimeType === 'image/vnd.dxf' || fileName.toLowerCase().endsWith('.dxf')) {
            const parser = new DxfParser();
            const drawing = parser.parseSync(buffer.toString('utf8'));
            const entityCounts = (drawing?.entities || []).reduce((counts, entity) => ({ ...counts, [entity.type]: (counts[entity.type] || 0) + 1 }), {});
            analysis = { kind: 'dxf', status: 'structural-extraction', entityCounts, layerCount: Object.keys(drawing?.tables?.layer?.layers || {}).length, contentForAI: JSON.stringify({ entityCounts }), reviewRequired: true };
        } else if (IMAGE_TYPES.has(mimeType)) {
            const worker = await createWorker('eng');
            const result = await worker.recognize(buffer);
            await worker.terminate();
            const text = truncate(result?.data?.text || '');
            analysis = { kind: 'image', status: 'ocr-extracted', text, contentForAI: text, reviewRequired: true, note: 'OCR captures visible text only. Engineering geometry, symbols and dimensions require human review or a configured vision model.' };
        } else if (VIDEO_TYPES.has(mimeType) || AUDIO_TYPES.has(mimeType)) {
            analysis = { kind: VIDEO_TYPES.has(mimeType) ? 'video' : 'audio', status: 'awaiting-provider', contentForAI: '', reviewRequired: true, note: 'The file is stored securely. Configure an approved transcription or vision provider before using media content for design interpretation.' };
        } else {
            analysis = { kind: 'binary', status: 'unsupported', contentForAI: '', reviewRequired: true, note: 'This file type is stored but no deterministic parser is registered.' };
        }
        attachment.analysisStatus = analysis.status;
        return { attachment, analysis };
    }
}

module.exports = MultimodalAttachmentService;
