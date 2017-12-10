var config = new Object();

config.RES = {
  CREATED: 'Created successfully',
  ERROR: 'Error processing data',
  NOCREATED: 'Error trying to create item',
  OK: 'OK',
  PRODUCT_MISSED: 'Product not found',
  PRODUCT_SALES: 'Error al borrar, producto ya tiene ventas',
  UNAUTHORIZED: 'You need permissions',
  DELETE_OK: 'Producto borrado correctamente!'
};

config.STATUS = {
  CREATED: 201,
  UNAUTHORIZED: 401,
  OK: 200,
  SERVER_ERROR: 500
};

config.MINIMUM_PACKAGES = [
  'Unidad',
  'Kilogramo',
  'Litro'
];

config.CATEGORIES = [
  'Aceites comestibles',
  'Alimento para mascotas',
  'Arrozes',
  'Atúnes',
  'Azúcar',
  'Bebidas',
  'Cereales',
  'Cigarros',
  'Condimentos',
  'Cuidado bucal y piel',
  'Desechables',
  'Detergentes',
  'Dulces y golosinas',
  'Fideos',
  'Galletas',
  'Harinas',
  'Higiénicos',
  'Huevos',
  'Jabones',
  'Leches',
  'Limpiadores',
  'Mantequilla',
  'Mayonesas',
  'Menestras',
  'Perfumeria y farmacia',
  'Refrescos',
  'Shampoo',
  'Sopas instantáneas',
  'Suavizantes de ropa',
  'Toallas femeninas',
  'Velas',
  'Yogurt'
];

module.exports = config;