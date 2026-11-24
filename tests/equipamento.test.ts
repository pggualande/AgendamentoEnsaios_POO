import { describe, it, expect } from 'vitest';
import { Equipamento } from '../src/equipamento';
import { Modalidade } from '../src/modalidade';

describe('Equipamento', () => {
    describe('criação válida (R01, R02)', () => {
        it('expõe código, nome e modalidades', () => {
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

    describe('entradas inválidas (T01)', () => {
        it.each([
            ['vazio', ''],
            ['só espaços', '   '],
            ['tabulação e quebra de linha', '\t\n'],
        ])('rejeita código %s', (_descricao, codigo) => {
            expect(() => new Equipamento(codigo, 'Osciloscópio', [Modalidade.ELETRICO])).toThrow(RangeError);
        });

        it.each([
            ['vazio', ''],
            ['só espaços', '   '],
        ])('rejeita nome %s', (_descricao, nome) => {
            expect(() => new Equipamento('EQ-1', nome, [Modalidade.ELETRICO])).toThrow(RangeError);
        });

        it('rejeita lista de modalidades vazia', () => {
            expect(() => new Equipamento('EQ-1', 'Osciloscópio', [])).toThrow(RangeError);
        });

        it('rejeita modalidade desconhecida', () => {
            const invalida = 'QUIMICO' as unknown as Modalidade;
            expect(() => new Equipamento('EQ-1', 'Osciloscópio', [invalida])).toThrow(RangeError);
        });
    });

    describe('encapsulamento (T02)', () => {
        it('alterar o conjunto devolvido não muda o equipamento', () => {
            const eq = new Equipamento('EQ-1', 'Osciloscópio', [Modalidade.ELETRICO]);
            const consulta = eq.modalidades() as Set<Modalidade>;
            consulta.add(Modalidade.MECANICO);
            consulta.clear();

            expect(eq.suporta(Modalidade.ELETRICO)).toBe(true);
            expect(eq.suporta(Modalidade.MECANICO)).toBe(false);
            expect(eq.modalidades().size).toBe(1);
        });

        it('alterar a lista usada na criação não muda o equipamento', () => {
            const lista: Modalidade[] = [Modalidade.ELETRICO];
            const eq = new Equipamento('EQ-1', 'Osciloscópio', lista);
            lista.push(Modalidade.MECANICO);

            expect(eq.suporta(Modalidade.MECANICO)).toBe(false);
        });
    });
});