// Define una clase llamada FilterSupplierDto que se utiliza como DTO (Data Transfer Object).
export class FilterSupplierDto {
    // Limita el número de resultados devueltos por la consulta.
    limit: number;

    // Especifica la página de resultados para la consulta paginada.
    page: number;

    // Nombre del proveedor (opcional) utilizado como filtro en la consulta.
    nameSupplier: string;

    // Número de identificación del gerente del proveedor.
    managerCi: string;

    // Número de teléfono del gerente del proveedor.
    managerPhone: number;

    // Dirección comercial del proveedor.
    businessAddress: string;

    // Correo electrónico del proveedor.
    email: string;

    // Nombre comercial de la empresa proveedora.
    businessName: string;

    // Número de Identificación Tributaria del proveedor.
    NIT: string;

}