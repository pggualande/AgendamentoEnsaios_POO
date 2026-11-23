import { describe, it, expect } from 'vitest';
import { Estado, isEstado } from '../src/estado';

describe('Estado', () => {
    it('traz os cinco estados do ciclo de vida', () => {
        expect(Estado.SOLICITADO).toBe('SOLICITADO');
        expect(Estado.CONFIRMADO).toBe('CONFIRMADO');
        expect(Estado.EM_EXECUCAO).toBe('EM_EXECUCAO');
        expect(Estado.CONCLUIDO).toBe('CONCLUIDO');
        expect(Estado.CANCELADO).toBe('CANCELADO');
    });

    it('não deixa passar nenhum estado além dos cinco', () => {
        expect(Object.keys(Estado)).toHaveLength(5);
    });

    it.each([
        'SOLICITADO',
        'CONFIRMADO',
        'EM_EXECUCAO',
        'CONCLUIDO',
        'CANCELADO',
    ])('reconhece %s como válido', (valor) => {
        expect(isEstado(valor)).toBe(true);
    });

    it.each(['', 'solicitado', 'EM EXECUCAO', 'FINALIZADO', null, undefined, 42])(
        'rejeita %s',
        (valor) => {
            expect(isEstado(valor)).toBe(false);
        },
    );
});