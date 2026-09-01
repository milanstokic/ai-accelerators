import { describe, expect, it } from 'vitest';
import { firstHeading, firstParagraph, parseFrontmatter, truncate } from '../../src/skills/frontmatter';

describe('parseFrontmatter', () => {
  it('parses simple keys and strips quotes', () => {
    const { data, body } = parseFrontmatter('---\nname: "x"\ndescription: \'Does y\'\n---\n# Body\n');
    expect(data).toEqual({ name: 'x', description: 'Does y' });
    expect(body).toBe('# Body\n');
  });
  it('joins folded multi-line values', () => {
    const { data } = parseFrontmatter('---\ndescription: >\n  line one\n  line two\nname: n\n---\n');
    expect(data.description).toBe('line one line two');
    expect(data.name).toBe('n');
  });
  it('returns the whole text as body without frontmatter', () => {
    expect(parseFrontmatter('# Title\n')).toEqual({ data: {}, body: '# Title\n' });
    expect(parseFrontmatter('---\nunterminated')).toEqual({ data: {}, body: '---\nunterminated' });
  });
});

describe('body helpers', () => {
  it('finds the first heading and paragraph', () => {
    const body = '# Add Tests\n\n```sh\nignored\n```\n\nGenerate tests\nfor code.\n\nSecond para.';
    expect(firstHeading(body)).toBe('Add Tests');
    expect(firstParagraph(body)).toBe('Generate tests for code.');
    expect(firstParagraph('')).toBeUndefined();
  });
  it('truncates with an ellipsis', () => {
    expect(truncate('abcdef', 4)).toBe('abc…');
    expect(truncate('abc', 4)).toBe('abc');
  });
});
