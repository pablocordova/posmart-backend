var config = new Object();

config.RES = {
  OK: 'OK',
  CREATED: 'Product created successfully',
  NOCREATED: 'Error to create user'
};

config.STATUS = {
  CREATED: 201,
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
  'Galletas',
  'Harinas',
  'Higiénicos',
  'Huevos',
  'Jabones',
  'Leches',
  'Limpiadores',
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