import { AISearchInputDto } from './dto';
import { ProductResult } from './interfaces';

function normalizeText(value?: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value?: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter((token) => token.length > 1),
  );
}

function isPriceInRange(
  price: string,
  priceRange?: { min: number; max: number },
): boolean {
  if (!priceRange) return false;

  const numericPrice = Number.parseFloat(price);
  return (
    Number.isFinite(numericPrice) &&
    numericPrice >= priceRange.min &&
    numericPrice <= priceRange.max
  );
}

export function rankPlatformProducts(
  input: AISearchInputDto,
  products: ProductResult[],
): ProductResult[] {
  const normalizedCommodity = normalizeText(input.commodity);
  const commodityTokens = tokenize(input.commodity);
  const requestedHsPrefix = (input.hsCode || '').replace(/\D/g, '').slice(0, 4);
  const requestedCountry = normalizeText(input.country);

  return products
    .map((product) => {
      const searchableText = [
        product.name,
        product.category,
        product.description,
      ].join(' ');
      const normalizedProductName = normalizeText(product.name);
      const productTokens = tokenize(searchableText);
      const reasons: string[] = [];
      let score = 0;

      if (
        normalizedProductName === normalizedCommodity ||
        normalizedProductName.includes(normalizedCommodity) ||
        normalizedCommodity.includes(normalizedProductName)
      ) {
        score += 45;
        reasons.push('Strong commodity name match');
      }

      const matchingTokens = [...commodityTokens].filter((token) =>
        productTokens.has(token),
      );
      if (commodityTokens.size > 0 && matchingTokens.length > 0) {
        score += Math.round(
          (matchingTokens.length / commodityTokens.size) * 30,
        );
        reasons.push(
          `${matchingTokens.length}/${commodityTokens.size} search terms matched`,
        );
      }

      const productHsPrefix = (product.hsnCode || '')
        .replace(/\D/g, '')
        .slice(0, 4);
      if (
        requestedHsPrefix &&
        productHsPrefix &&
        productHsPrefix === requestedHsPrefix
      ) {
        score += 25;
        reasons.push(`HS ${requestedHsPrefix} match`);
      }

      const reliability = Math.min(100, Math.max(0, product.probability ?? 50));
      score += Math.round(reliability * 0.2);
      reasons.push(`${Math.round(reliability)}% seller reliability`);

      const productCountry = normalizeText(
        product.exportLocation || product.sellerCountry,
      );
      if (
        requestedCountry &&
        productCountry &&
        (productCountry.includes(requestedCountry) ||
          requestedCountry.includes(productCountry))
      ) {
        score += 10;
        reasons.push('Country preference matched');
      }

      if (isPriceInRange(product.price, input.priceRange)) {
        score += 10;
        reasons.push('Price fits the requested range');
      }

      return {
        ...product,
        sourceType: 'platform_recommended' as const,
        aiMatchScore: Math.min(100, Math.max(0, score)),
        aiMatchReason: reasons.join('. '),
      };
    })
    .sort((left, right) => {
      const scoreDifference =
        (right.aiMatchScore || 0) - (left.aiMatchScore || 0);
      if (scoreDifference !== 0) return scoreDifference;
      return left.name.localeCompare(right.name);
    });
}
