import { describe, it, expect } from 'vitest';
import { Intervalo } from '../src/intervalo';

describe('Intervalo', () => {
    describe('construção válida', () => {
        it.each([
            [0, 1],
            [60, 120],
            [0, 10080],
            [10079, 10080],
        ])('aceita [%i, %i)', (inicio, fim) => {
            const janela = new Intervalo(inicio, fim);
            expect(janela.inicio()).toBe(inicio);
            expect(janela.fim()).toBe(fim);
            expect(janela.duracao()).toBe(fim - inicio);
        });
    });

    describe('construção inválida (RangeError)', () => {
        it.each([
            ['início negativo', -1, 10],
            ['fim além do horizonte', 0, 10081],
            ['início igual ao fim', 60, 60],
            ['intervalo invertido', 120, 60],
            ['início decimal', 10.5, 60],
            ['fim decimal', 10, 60.5],
            ['NaN', Number.NaN, 60],
            ['Infinito', 0, Number.POSITIVE_INFINITY],
        ])('rejeita %s', (_descricao, inicio, fim) => {
            expect(() => new Intervalo(inicio, fim)).toThrow(RangeError);
        });
    });

    describe('sobreposição sem fechar [início, fim)', () => {
        const base = new Intervalo(60, 120);

        it('pega interseção parcial', () => {
            expect(base.sobrepoe(new Intervalo(100, 160))).toBe(true);
        });
        it('pega quando o intervalo tá dentro ou é igualzinho', () => {
            expect(base.sobrepoe(new Intervalo(70, 90))).toBe(true);
            expect(base.sobrepoe(new Intervalo(60, 120))).toBe(true);
        });
        it('deixa passar janelas coladas, de qualquer lado', () => {
            expect(base.sobrepoe(new Intervalo(120, 180))).toBe(false);
            expect(new Intervalo(0, 60).sobrepoe(base)).toBe(false);
        });
        it('não pega intervalos separados', () => {
            expect(base.sobrepoe(new Intervalo(200, 260))).toBe(false);
        });
    });
});