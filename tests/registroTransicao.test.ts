import { describe, it, expect } from 'vitest';
import { RegistroTransicao } from '../src/registroTransicao';
import { Estado } from '../src/estado';

describe('RegistroTransicao', () => {
    describe('criacao valida', () => {
        it('exibe a sequencia, estado e operacao', () => {
            const reg = new RegistroTransicao(1, Estado.SOLICITADO, 'solicitar');
            expect(reg.sequencia()).toBe(1);
            expect(reg.estado()).toBe(Estado.SOLICITADO);
            expect(reg.operacao()).toBe('solicitar');

        });
        it.each([
            [1, Estado.SOLICITADO, 'solicitar'],
            [2, Estado.CONFIRMADO, 'confirmar'],
            [3, Estado.EM_EXECUCAO, 'iniciar'],
            [4, Estado.CONCLUIDO, 'concluir'],
            [5, Estado.CANCELADO, 'cancelar'],
        ])('aceita sequencia %i com estado %s', (sequencia, estado, operacao) => {
            const reg = new RegistroTransicao(sequencia, estado, operacao);
            expect(reg.sequencia()).toBe(sequencia);
            expect(reg.estado()).toBe(estado);
        });
    });
    describe('entradas invalidas', () => {
        it.each([
            ['zero', 0],
            ['negativa', -1],
            ['fracionaria', 1.5],
            ['NaN', Number.NaN],
            ['Infinity', Number.POSITIVE_INFINITY],
        ])('rejeita sequencia %s', (_descricao, sequencia) => {
            expect(() => new RegistroTransicao(sequencia, Estado.SOLICITADO, 'solicitar')).toThrow(RangeError);
        });

        it('rejeita estado desconhecido', () => {
            const invalido = 'FINALIZADO' as unknown as Estado;
            expect(() => new RegistroTransicao(1, invalido, 'solicitar')).toThrow(RangeError);
        });

        it.each([
            ['vazia', ''],
            ['so espaços', '   '],
        ])('rejeita operacao %s', (_descricao, operacao) => {
            expect(() => new RegistroTransicao(1, Estado.SOLICITADO, operacao)).toThrow(RangeError);
        });
    });
});