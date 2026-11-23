import { describe, it, expect } from 'vitest';
import { Modalidade, isModalidade } from '../src/modalidade';

describe('Modalidade', () => {
    it('expõe ELETRICO e MECANICO', () => {
        expect(Modalidade.ELETRICO).toBe('ELETRICO');
        expect(Modalidade.MECANICO).toBe('MECANICO');
    });

    it.each(['ELETRICO', 'MECANICO'])('reconhece %s como válida', (valor) => {
        expect(isModalidade(valor)).toBe(true);
    });

    it.each(['', 'eletrico', 'QUIMICO', null, undefined, 42])(
        'rejeita %s',
        (valor) => {
            expect(isModalidade(valor)).toBe(false);
        },
    );
});