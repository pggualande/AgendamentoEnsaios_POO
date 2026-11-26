export interface VerificadorAcesso {
    verificarAcesso(matricula: string): Promise<boolean>;
}