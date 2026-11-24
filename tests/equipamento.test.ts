import { describe, it, expect } from 'vitest';
import { Equipamento } from '../src/equipamento';
import { Modalidade } from '../src/modalidade';

describe('Equipamento', () => {
    describe('criacao valida (R01, R02)', () => {
        it('mostra código, nome e modalidades', () => {
            const eq = new Equipamento('EQ-10', 'Osciloscópio', [Modalidade.ELETRICO]);
            expect(eq.codigo()).toBe('EQ-10');
            expect(eq.nome()).toBe('Osciloscópio');
            expect(eq.modalidades().has(Modalidade.ELETRICO)).toBe(true);
        });

        it('suporta apenas as modalidades informadas', () => {
            const eq = new Equipamento('EQ-10', 'Osciloscópio', [Modalidade.ELETRICO]);
            expect(eq.suporta(Modalidade.ELETRICO)).toBe(true);
            expect(eq.suporta(Modalidade.MECANICO)).toBe(false);
        });

        it('aceita mais de uma modalidade', () => {
            const eq = new Equipamento('EQ-11', 'Bancada', [Modalidade.ELETRICO, Modalidade.MECANICO]);
            expect(eq.modalidades().size).toBe(2);
        });
    });

    describe('entradas invalidas (T01)', () => {
        it.each([
            ['vazio', ''],
            ['so espacos', '   '],
            ['tabulacao e quebra de linha', '\t\n'],
        ])('rejeita codigo %s', (_descricao, codigo) => {
            expect(() => new Equipamento(codigo, 'Osciloscopio', [Modalidade.ELETRICO])).toThrow(RangeError);
        });

        it.each([
            ['vazio', ''],
            ['so espacos', '   '],
        ])('rejeita nome %s', (_descricao, nome) => {
            expect(() => new Equipamento('EQ-1', nome, [Modalidade.ELETRICO])).toThrow(RangeError);
        });

        it('rejeita lista de modalidades vazia', () => {
            expect(() => new Equipamento('EQ-1', 'Osciloscopio', [])).toThrow(RangeError);
        });

        it('rejeita modalidade desconhecida', () => {
            const invalida = 'QUIMICO' as unknown as Modalidade;
            expect(() => new Equipamento('EQ-1', 'Osciloscopio', [invalida])).toThrow(RangeError);
        });
    });

    describe('encapsulamento (T02)', () => {
        it('alterar o conjunto devolvido nao muda o equipamento', () => {
            const eq = new Equipamento('EQ-1', 'Osciloscopio', [Modalidade.ELETRICO]);
            const consulta = eq.modalidades() as Set<Modalidade>;
            consulta.add(Modalidade.MECANICO);
            consulta.clear();

            expect(eq.suporta(Modalidade.ELETRICO)).toBe(true);
            expect(eq.suporta(Modalidade.MECANICO)).toBe(false);
            expect(eq.modalidades().size).toBe(1);
        });

        it('alterar a lista usada na criacao nao muda o equipamento', () => {
            const lista: Modalidade[] = [Modalidade.ELETRICO];
            const eq = new Equipamento('EQ-1', 'Osciloscopio', lista);
            lista.push(Modalidade.MECANICO);

            expect(eq.suporta(Modalidade.MECANICO)).toBe(false);
        });
    });
});