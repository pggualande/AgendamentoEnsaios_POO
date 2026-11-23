export type Modalidade = 'ELETRICO' | 'MECANICO';

export const Modalidade = {
    ELETRICO: 'ELETRICO',
    MECANICO: 'MECANICO',
} as const;

export function isModalidade(valor: unknown): valor is Modalidade {
    return Object.values(Modalidade).includes(valor as Modalidade);
}