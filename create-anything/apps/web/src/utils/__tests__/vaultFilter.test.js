import { describe, it, expect } from 'vitest';
import { filterVaultUploads, extractFileName } from '../vaultFilter';

describe('extractFileName', () => {
  it('extracts filename from a valid URL', () => {
    expect(extractFileName('https://example.com/path/to/document.pdf')).toBe('document.pdf');
  });

  it('handles URL with no path', () => {
    expect(extractFileName('https://example.com')).toBe('example.com');
  });

  it('handles URL ending with slash', () => {
    expect(extractFileName('https://example.com/path/')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(extractFileName(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(extractFileName(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(extractFileName('')).toBe('');
  });
});

describe('filterVaultUploads', () => {
  const mockUploads = [
    { id: 1, file_url: 'https://cdn.example.com/docs/court_order.pdf', tag: 'court docs' },
    { id: 2, file_url: 'https://cdn.example.com/docs/drug_test_result.pdf', tag: 'drug screens' },
    { id: 3, file_url: 'https://cdn.example.com/docs/employment_letter.pdf', tag: 'employment' },
    { id: 4, file_url: 'https://cdn.example.com/docs/lease_agreement.pdf', tag: 'housing' },
    { id: 5, file_url: 'https://cdn.example.com/docs/receipt.jpg', tag: 'services' },
  ];

  describe('null/undefined safety', () => {
    it('returns empty array for null uploads', () => {
      expect(filterVaultUploads(null, 'All', '')).toEqual([]);
    });

    it('returns empty array for undefined uploads', () => {
      expect(filterVaultUploads(undefined, 'All', '')).toEqual([]);
    });

    it('returns empty array for non-array uploads', () => {
      expect(filterVaultUploads('not an array', 'All', '')).toEqual([]);
      expect(filterVaultUploads(123, 'All', '')).toEqual([]);
      expect(filterVaultUploads({}, 'All', '')).toEqual([]);
    });

    it('filters out null entries in uploads array', () => {
      const uploadsWithNull = [
        { id: 1, file_url: 'https://example.com/doc.pdf', tag: 'services' },
        null,
        { id: 2, file_url: 'https://example.com/other.pdf', tag: 'housing' },
      ];
      const result = filterVaultUploads(uploadsWithNull, 'All', '');
      expect(result).toHaveLength(2);
      expect(result.map(u => u.id)).toEqual([1, 2]);
    });

    it('filters out undefined entries in uploads array', () => {
      const uploadsWithUndefined = [
        { id: 1, file_url: 'https://example.com/doc.pdf', tag: 'services' },
        undefined,
      ];
      const result = filterVaultUploads(uploadsWithUndefined, 'All', '');
      expect(result).toHaveLength(1);
    });

    it('handles upload with null file_url', () => {
      const uploads = [{ id: 1, file_url: null, tag: 'services' }];
      expect(() => filterVaultUploads(uploads, 'All', '')).not.toThrow();
      expect(filterVaultUploads(uploads, 'All', '')).toHaveLength(1);
    });

    it('handles upload with undefined file_url', () => {
      const uploads = [{ id: 1, tag: 'services' }]; // file_url is undefined
      expect(() => filterVaultUploads(uploads, 'All', '')).not.toThrow();
      expect(filterVaultUploads(uploads, 'All', '')).toHaveLength(1);
    });

    it('handles upload with null tag', () => {
      const uploads = [{ id: 1, file_url: 'https://example.com/doc.pdf', tag: null }];
      expect(() => filterVaultUploads(uploads, 'All', '')).not.toThrow();
      expect(filterVaultUploads(uploads, 'All', '')).toHaveLength(1);
    });

    it('handles upload with undefined tag', () => {
      const uploads = [{ id: 1, file_url: 'https://example.com/doc.pdf' }]; // tag is undefined
      expect(() => filterVaultUploads(uploads, 'All', '')).not.toThrow();
      expect(filterVaultUploads(uploads, 'All', '')).toHaveLength(1);
    });

    it('handles null searchQuery', () => {
      expect(() => filterVaultUploads(mockUploads, 'All', null)).not.toThrow();
      expect(filterVaultUploads(mockUploads, 'All', null)).toHaveLength(5);
    });

    it('handles undefined searchQuery', () => {
      expect(() => filterVaultUploads(mockUploads, 'All', undefined)).not.toThrow();
      expect(filterVaultUploads(mockUploads, 'All', undefined)).toHaveLength(5);
    });
  });

  describe('tag filtering', () => {
    it('returns all uploads when filterTag is "All"', () => {
      const result = filterVaultUploads(mockUploads, 'All', '');
      expect(result).toHaveLength(5);
    });

    it('filters by exact tag match', () => {
      const result = filterVaultUploads(mockUploads, 'court docs', '');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('returns empty array when no uploads match tag', () => {
      const result = filterVaultUploads(mockUploads, 'nonexistent tag', '');
      expect(result).toHaveLength(0);
    });

    it('excludes uploads with null/undefined tag when filtering by specific tag', () => {
      const uploads = [
        { id: 1, file_url: 'https://example.com/doc.pdf', tag: 'services' },
        { id: 2, file_url: 'https://example.com/other.pdf', tag: null },
        { id: 3, file_url: 'https://example.com/another.pdf' }, // undefined tag
      ];
      const result = filterVaultUploads(uploads, 'services', '');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('search filtering', () => {
    it('searches in filename (case-insensitive)', () => {
      const result = filterVaultUploads(mockUploads, 'All', 'COURT');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('searches in tag (case-insensitive)', () => {
      const result = filterVaultUploads(mockUploads, 'All', 'SCREENS');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('matches partial filename', () => {
      const result = filterVaultUploads(mockUploads, 'All', 'letter');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    it('matches partial tag', () => {
      const result = filterVaultUploads(mockUploads, 'All', 'employ');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    it('trims whitespace from search query', () => {
      const result = filterVaultUploads(mockUploads, 'All', '  court  ');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('returns all when search query is empty string', () => {
      const result = filterVaultUploads(mockUploads, 'All', '');
      expect(result).toHaveLength(5);
    });

    it('returns all when search query is only whitespace', () => {
      const result = filterVaultUploads(mockUploads, 'All', '   ');
      expect(result).toHaveLength(5);
    });

    it('returns empty array when no uploads match search', () => {
      const result = filterVaultUploads(mockUploads, 'All', 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('combined tag and search filtering', () => {
    it('applies both tag filter and search query', () => {
      // Search for "pdf" but only in "court docs" tag
      const result = filterVaultUploads(mockUploads, 'court docs', 'pdf');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('returns empty when tag matches but search does not', () => {
      const result = filterVaultUploads(mockUploads, 'court docs', 'receipt');
      expect(result).toHaveLength(0);
    });

    it('returns empty when search matches but tag does not', () => {
      const result = filterVaultUploads(mockUploads, 'housing', 'court');
      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty uploads array', () => {
      expect(filterVaultUploads([], 'All', '')).toEqual([]);
      expect(filterVaultUploads([], 'services', 'test')).toEqual([]);
    });

    it('handles upload with empty string file_url', () => {
      const uploads = [{ id: 1, file_url: '', tag: 'services' }];
      const result = filterVaultUploads(uploads, 'All', '');
      expect(result).toHaveLength(1);
    });

    it('handles upload with empty string tag', () => {
      const uploads = [{ id: 1, file_url: 'https://example.com/doc.pdf', tag: '' }];
      const result = filterVaultUploads(uploads, 'All', '');
      expect(result).toHaveLength(1);
    });

    it('can search in upload with null file_url by matching tag', () => {
      const uploads = [{ id: 1, file_url: null, tag: 'important' }];
      const result = filterVaultUploads(uploads, 'All', 'important');
      expect(result).toHaveLength(1);
    });

    it('excludes upload with null tag and file_url when searching', () => {
      const uploads = [{ id: 1, file_url: null, tag: null }];
      const result = filterVaultUploads(uploads, 'All', 'anything');
      expect(result).toHaveLength(0);
    });
  });
});
