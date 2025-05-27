export class CreateProductDto {
  name: string;
  moq?: string;
  preciseDescription?: string;
  detailedDescription?: string;
  category?: string;
  hsnCode?: string;
  productImage?: string;
  testReports?: string;
  price?: number;
  sku?: string;
  onSale?: boolean;
  discount?: number;
  salePrice?: number;
  costOfGoods?: number;
  profit?: number;
  margin?: number;
  quantity?: number;
  tags?: string[];
}

export class UpdateProductDto {
  name?: string;
  moq?: string;
  preciseDescription?: string;
  detailedDescription?: string;
  category?: string;
  hsnCode?: string;
  productImage?: string;
  testReports?: string;
  price?: number;
  sku?: string;
  onSale?: boolean;
  discount?: number;
  salePrice?: number;
  costOfGoods?: number;
  profit?: number;
  margin?: number;
  quantity?: number;
  tags?: string[];
} 