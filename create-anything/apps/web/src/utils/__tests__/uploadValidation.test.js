import { describe, it, expect } from 'vitest';
import { validateUploadRequest, sanitizeFilename } from '../uploadValidation';

describe('validateUploadRequest', () => {
  const validRequest = {
    case_id: 'abc-123',
    filename: 'document.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024,
    tag: 'court_docs',
  };

  it('should accept valid requests', () => {
    expect(validateUploadRequest(validRequest)).toEqual({ ok: true });
  });

  describe('required fields', () => {
    it('should reject missing case_id', () => {
      const result = validateUploadRequest({ ...validRequest, case_id: null });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('case_id is required');
    });

    it('should reject missing filename', () => {
      const result = validateUploadRequest({ ...validRequest, filename: '' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('filename is required');
    });

    it('should reject missing mime_type', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: null });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('mime_type is required');
    });
  });

  describe('size validation', () => {
    it('should reject non-finite size', () => {
      const result = validateUploadRequest({ ...validRequest, size_bytes: NaN });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('size_bytes must be a positive number');
    });

    it('should reject zero size', () => {
      const result = validateUploadRequest({ ...validRequest, size_bytes: 0 });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('size_bytes must be a positive number');
    });

    it('should reject negative size', () => {
      const result = validateUploadRequest({ ...validRequest, size_bytes: -100 });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('size_bytes must be a positive number');
    });

    it('should reject files over 10MB', () => {
      const result = validateUploadRequest({ ...validRequest, size_bytes: 11 * 1024 * 1024 });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('file too large (max 10MB)');
    });

    it('should accept files exactly 10MB', () => {
      const result = validateUploadRequest({ ...validRequest, size_bytes: 10 * 1024 * 1024 });
      expect(result.ok).toBe(true);
    });
  });

  describe('tag validation', () => {
    it('should accept valid tags', () => {
      const validTags = ['court_docs', 'services', 'drug_screens', 'housing', 'employment', 'visitation', 'other'];
      for (const tag of validTags) {
        const result = validateUploadRequest({ ...validRequest, tag });
        expect(result.ok).toBe(true);
      }
    });

    it('should reject invalid tag', () => {
      const result = validateUploadRequest({ ...validRequest, tag: 'invalid_tag' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('invalid tag');
    });

    it('should reject missing tag', () => {
      const result = validateUploadRequest({ ...validRequest, tag: null });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('invalid tag');
    });
  });

  describe('mime_type validation', () => {
    it('should accept PDF', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: 'application/pdf' });
      expect(result.ok).toBe(true);
    });

    it('should accept PNG', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: 'image/png' });
      expect(result.ok).toBe(true);
    });

    it('should accept JPEG', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: 'image/jpeg' });
      expect(result.ok).toBe(true);
    });

    it('should accept WebP', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: 'image/webp' });
      expect(result.ok).toBe(true);
    });

    it('should accept Word doc', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: 'application/msword' });
      expect(result.ok).toBe(true);
    });

    it('should accept Word docx', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      expect(result.ok).toBe(true);
    });

    it('should reject executable', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: 'application/x-msdownload' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('invalid mime_type');
    });

    it('should reject video', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: 'video/mp4' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('invalid mime_type');
    });

    it('should reject GIF (not in allowed list)', () => {
      const result = validateUploadRequest({ ...validRequest, mime_type: 'image/gif' });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('invalid mime_type');
    });
  });
});

describe('sanitizeFilename', () => {
  it('should keep safe characters', () => {
    expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
    expect(sanitizeFilename('my-file_v2.docx')).toBe('my-file_v2.docx');
    expect(sanitizeFilename('Report (2024).pdf')).toBe('Report (2024).pdf');
  });

  it('should replace unsafe characters with underscore', () => {
    expect(sanitizeFilename('file<script>.pdf')).toBe('file_script_.pdf');
    expect(sanitizeFilename('path/to/file.pdf')).toBe('path_to_file.pdf');
    expect(sanitizeFilename('file@#$%.pdf')).toBe('file_.pdf');
  });

  it('should truncate long filenames to 120 chars', () => {
    const longName = 'a'.repeat(200) + '.pdf';
    const result = sanitizeFilename(longName);
    expect(result.length).toBe(120);
  });

  it('should handle non-string input', () => {
    expect(sanitizeFilename(12345)).toBe('12345');
    expect(sanitizeFilename(null)).toBe('null');
  });
});
