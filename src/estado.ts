export type Estado = 'SOLICITADO' | 'CONFIRMADO' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'CANCELADO';
export const Estado = {
    SOLICITADO: 'SOLICITADO',
    CONFIRMADO: 'CONFIRMADO',
    EM_EXECUCAO: 'EM_EXECUCAO',
    CONCLUIDO: 'CONCLUIDO',
    CANCELADO: 'CANCELADO',
} as const;

export function isEstado(valor: unknown): valor is Estado {
    return Object.values(Estado).includes(valor as Estado);
}