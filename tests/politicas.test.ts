import { describe, it, expect } from 'vitest';
import { Intervalo } from '../src/intervalo';
import { Modalidade } from '../src/modalidade';
import type { PoliticaDuracao } from '../src/politicaDuracao';
import { PoliticaEletrica } from '../src/politicaEletrica';
import { PoliticaMecanica } from '../src/politicaMecanica';

const casos = [
    { nome: 'PoliticaEletrica', politica: new PoliticaEletrica(), modalidade: Modalidade.ELETRICO, min: 30, max: 120 },
    { nome: 'PoliticaMecanica', politica: new PoliticaMecanica(), modalidade: Modalidade.MECANICO, min: 45, max: 180 }
];

describe.each(casos)('$nome', ({ politica, modalidade, min, max }) => {
    it('Modalidade atendida', () => {
        expect(politica.modalidade()).toBe(modalidade);
    });
    it.each([min, min + 1, max, max - 1])('duração de %i minutos foi aceita', (duracao) => {
        expect(() => politica.validar(new Intervalo(0, duracao))).not.toThrow();
    });
    it.each([min - 1, max + 1])('duração de %i minutos foi rejeitada', (duracao) => {
        expect(() => politica.validar(new Intervalo(0, duracao))).toThrow(RangeError);
    });
})
describe('Teste de polimorfismo', () => {
    it('Testando se a mesma chamada da resultados diferentes de acordo com a politica', () => {
        const eletrica: PoliticaDuracao = new PoliticaEletrica();
        const mecanica: PoliticaDuracao = new PoliticaMecanica();
        const janela = new Intervalo(0, 40);

        expect(() => eletrica.validar(janela)).not.toThrow();
        expect(() => mecanica.validar(janela)).toThrow(RangeError);
    })
})