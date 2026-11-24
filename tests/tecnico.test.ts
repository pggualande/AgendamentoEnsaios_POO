import { describe, it, expect } from 'vitest';
import { Tecnico } from '../src/tecnico';
import { Modalidade } from '../src/modalidade';

describe('Tecnico', () => {
    describe('criação válida (R01, R02)', () => {
        it('exibe matricula, nome e habilitacoes', () => {
            const t = new Tecnico('TC-04', 'Lia', [Modalidade.ELETRICO]);
            expect(t.matricula()).toBe('TC-04');
            expect(t.nome()).toBe('Lia');
            expect(t.habilitacoes().has(Modalidade.ELETRICO)).toBe(true);
        });

        it('pode fazer apenas para as modalidades informadas', () => {
            const t = new Tecnico('TC-04', 'Lia', [Modalidade.ELETRICO]);
            expect(t.habilitadoPara(Modalidade.ELETRICO)).toBe(true);
            expect(t.habilitadoPara(Modalidade.MECANICO)).toBe(false);
        });

        it('aceita mais de uma habilitacao', () => {
            const t = new Tecnico('TC-05', 'Pedro', [Modalidade.ELETRICO, Modalidade.MECANICO]);
            expect(t.habilitacoes().size).toBe(2);
        });
    });

    describe('entradas inválidas (T01)', () => {
        it.each([
            ['vazio', ''],
            ['so espaços', '   '],
            ['tabulação e quebra de linha', '\t\n'],
        ])('rejeita codigo %s', (_descricao, matricula) => {
            expect(() => new Tecnico(matricula, 'Lia', [Modalidade.ELETRICO])).toThrow(RangeError);
        });

        it.each([
            ['vazio', ''],
            ['so espaços', '   '],
        ])('rejeita nome %s', (_descricao, nome) => {
            expect(() => new Tecnico('TC-04', nome, [Modalidade.ELETRICO])).toThrow(RangeError);
        });

        it('rejeita lista de habilitacoes vazia', () => {
            expect(() => new Tecnico('TC-04', 'Lia', [])).toThrow(RangeError);
        });

        it('rejeita modalidade desconhecida', () => {
            const invalida = 'QUIMICO' as unknown as Modalidade;
            expect(() => new Tecnico('TC-04', 'Lia', [invalida])).toThrow(RangeError);
        });
    });

    describe('encapsulamento (T02)', () => {
        it('alterar o conjunto devolvido não muda o tecnico', () => {
            const t = new Tecnico('TC-04', 'Lia', [Modalidade.ELETRICO]);
            const consulta = t.habilitacoes() as Set<Modalidade>;
            consulta.add(Modalidade.MECANICO);
            consulta.clear();

            expect(t.habilitadoPara(Modalidade.ELETRICO)).toBe(true);
            expect(t.habilitadoPara(Modalidade.MECANICO)).toBe(false);
            expect(t.habilitacoes().size).toBe(1);
        });

        it('alterar a lista usada na criacao nao muda o tecnico', () => {
            const lista: Modalidade[] = [Modalidade.ELETRICO];
            const t = new Tecnico('TC-04', 'Lia', lista);
            lista.push(Modalidade.MECANICO);

            expect(t.habilitadoPara(Modalidade.MECANICO)).toBe(false);
        });
    });
});