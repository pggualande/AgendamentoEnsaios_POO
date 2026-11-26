export interface VerificadorCalibracao {
    verificarCalibracao(codigo: string): Promise<boolean>;
}