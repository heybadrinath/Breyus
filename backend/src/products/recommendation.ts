export class ProductRecommender {
  private products: string[];

  constructor(products: string[]) {
    this.products = products;
  }

  recommend(title: string): string[] {
    return this.products.filter(productTitle => productTitle.includes(title));
  }

  getSuggestedTags(title: string): string[] {
    const tags = title.split(' ').map(word => word.toLowerCase());
    return [...new Set(tags)];
  }
}
