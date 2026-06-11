import { generateQuestion } from '../services/questionEngine';

describe('JNVST Question Generation Engine', () => {
  
  test('should generate a valid procedural Mathematics question', async () => {
    const q = await generateQuestion('Mathematics', 'medium', 'en');
    
    expect(q).toBeDefined();
    expect(q.category).toBe('Mathematics');
    const hasMatch = q.question.includes('Calculate') || q.question.includes('Solve') || q.question.includes('Find') || q.question.includes('average') || q.question.includes('LCM') || q.question.includes('addition');
    expect(hasMatch).toBe(true);
    expect(q.options).toHaveLength(4);
    expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
    expect(q.explanation).toBeDefined();
    expect(q.explanation.length).toBeGreaterThan(5);
  });

  test('should generate a valid procedural Mental Ability question', async () => {
    const q = await generateQuestion('Mental Ability', 'medium', 'en');

    expect(q).toBeDefined();
    expect(q.category).toBe('Mental Ability');
    expect(q.options).toHaveLength(4);
    expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
    expect(q.explanation).toBeDefined();
  });

  test('should generate programmatically rendered SVG figure reasoning question', async () => {
    const q = await generateQuestion('Figure & Design Reasoning', 'medium', 'en');

    expect(q).toBeDefined();
    expect(q.category).toBe('Figure & Design Reasoning');
    expect(q.questionSvg).toBeDefined();
    expect(q.questionSvg).toContain('<svg');
    expect(q.options).toHaveLength(4);
    
    // Every option must be a valid SVG string
    q.options.forEach(opt => {
      expect(opt).toContain('<svg');
    });
    
    expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
  });

});
