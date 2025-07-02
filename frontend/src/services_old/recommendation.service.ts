import { Product } from '../types/product';

class RecommendationService {
  private readonly SEARCH_HISTORY_KEY = 'user_search_history';
  private readonly MAX_HISTORY_ITEMS = 20;

  // Save search term to local storage
  saveSearchTerm(searchTerm: string): void {
    const history = this.getSearchHistory();
    
    // Add new term at the beginning, avoid duplicates
    const newHistory = [
      searchTerm,
      ...history.filter(term => term !== searchTerm)
    ].slice(0, this.MAX_HISTORY_ITEMS);
    
    localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  }

  // Get search history from local storage
  getSearchHistory(): string[] {
    const history = localStorage.getItem(this.SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  }

  // Clear search history
  clearSearchHistory(): void {
    localStorage.removeItem(this.SEARCH_HISTORY_KEY);
  }

  // Basic recommendation algorithm based on search history and available products
  getRecommendedProducts(allProducts: Product[], limit: number = 5): Product[] {
    const searchHistory = this.getSearchHistory();
    
    if (searchHistory.length === 0 || allProducts.length === 0) {
      // If no search history or products, return random products
      return this.getRandomProducts(allProducts, limit);
    }

    // Score products based on how well they match the search history
    // More recent searches have higher weight
    const scoredProducts = allProducts.map(product => {
      let score = 0;
      
      searchHistory.forEach((term, index) => {
        const weight = (searchHistory.length - index) / searchHistory.length;
        const termLower = term.toLowerCase();
        
        // Check product name
        if (product.name.toLowerCase().includes(termLower)) {
          score += 10 * weight;
        }
        
        // Check product description
        if (product.preciseDescription?.toLowerCase().includes(termLower)) {
          score += 5 * weight;
        }
        
        // Check product category
        if (product.category?.toLowerCase().includes(termLower)) {
          score += 8 * weight;
        }
        
        // Check product tags
        if (product.tags?.some(tag => tag.toLowerCase().includes(termLower))) {
          score += 7 * weight;
        }
      });
      
      return { product, score };
    });
    
    // Sort by score (descending) and return top products
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);
  }

  // Get random products when no recommendations are available
  private getRandomProducts(products: Product[], limit: number): Product[] {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }
}

const recommendationService = new RecommendationService();
export default recommendationService; 