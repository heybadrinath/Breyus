import { AISearchInputDto } from './dto';
import { ProductResult } from './interfaces';
import { rankPlatformProducts } from './platform-recommendation';

function product(overrides: Partial<ProductResult>): ProductResult {
  return {
    resultType: 'product',
    _id: 'product-id',
    name: 'Commodity',
    price: '1000',
    currency: 'USD',
    hsnCode: '00000000',
    category: 'General',
    description: 'Commodity listing',
    stock: '100',
    stockUnit: 'MT',
    moq: '10',
    moqUnit: 'MT',
    userId: 'user-id',
    isOnPlatform: true,
    sourceType: 'platform_only',
    probability: 70,
    ...overrides,
  };
}

describe('rankPlatformProducts', () => {
  it('ranks the strongest commodity and HS-code match first', () => {
    const input = {
      commodity: 'Basmati Rice',
      hsCode: '10063020',
    } as AISearchInputDto;

    const ranked = rankPlatformProducts(input, [
      product({
        _id: 'weak',
        name: 'Rice Flour',
        hsnCode: '11029000',
        probability: 95,
      }),
      product({
        _id: 'strong',
        name: 'Premium Basmati Rice',
        hsnCode: '10063090',
        probability: 80,
      }),
    ]);

    expect(ranked[0]._id).toBe('strong');
    expect(ranked[0].sourceType).toBe('platform_recommended');
    expect(ranked[0].aiMatchReason).toContain('HS 1006 match');
  });

  it('uses country and price preferences as ranking signals', () => {
    const input = {
      commodity: 'Copper Cathodes',
      country: 'India',
      priceRange: { min: 8000, max: 10000 },
    } as AISearchInputDto;

    const ranked = rankPlatformProducts(input, [
      product({
        _id: 'without-preferences',
        name: 'Copper Cathodes',
        price: '12000',
        sellerCountry: 'Germany',
      }),
      product({
        _id: 'with-preferences',
        name: 'Copper Cathodes',
        price: '9000',
        sellerCountry: 'India',
      }),
    ]);

    expect(ranked[0]._id).toBe('with-preferences');
    expect(ranked[0].aiMatchReason).toContain('Country preference matched');
    expect(ranked[0].aiMatchReason).toContain('Price fits the requested range');
  });

  it('keeps scores within the public 0-100 range', () => {
    const ranked = rankPlatformProducts(
      {
        commodity: 'Coffee',
        hsCode: '09011100',
        country: 'India',
        priceRange: { min: 1, max: 5000 },
      } as AISearchInputDto,
      [
        product({
          name: 'Coffee',
          hsnCode: '09011190',
          sellerCountry: 'India',
          price: '2000',
          probability: 100,
        }),
      ],
    );

    expect(ranked[0].aiMatchScore).toBe(100);
  });
});
