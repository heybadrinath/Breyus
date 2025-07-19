import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { SearchableInputHSN } from "./searchable_input_hsn";

interface ProductInformationProps {
  productInformation: {
    name: string;
    stock: string;
    stockUnit: string;
    moq: string;
    moqUnit: string;
    description: string;
    detailedDescription: string;
    category: string;
    hsnCode: string;
  };
  setProductInformation: React.Dispatch<React.SetStateAction<{
    name: string;
    stock: string;
    stockUnit: string;
    moq: string;
    moqUnit: string;
    description: string;
    detailedDescription: string;
    category: string;
    hsnCode: string;
  }>>;
}

// Product Information Component
const ProductInformation: React.FC<ProductInformationProps> = ({ productInformation, setProductInformation }) => {


  interface HSNRESULTS {
    _id: string;
    hsn_code: string;
    description: string;
    category: string;
  }
  const [hsnQuery, setHsnQuery] = useState<string>(''); // Search query state
  const [hsnResults, setHsnResults] = useState<HSNRESULTS[]>([]); // Results state
  const [hsnLoading, setHsnLoading] = useState<boolean>(false); // Loading state
  const [isHsnSelected, setIsHsnSelected] = useState<boolean>(false); // Selection state


  const [hsnDetails, setHsnDetails] = React.useState<null | {
    hsn_code: string;
    description: string;
    gst_rate: string;
    category: string;
    remarks: string;
  }>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductInformation(prev => ({
      ...prev,
      [name]: value
    }));


  };


  // Debounced search (effect hook)
  useEffect(() => {
    if (!hsnQuery) {
      setHsnResults([]);
      return;
    }

    if (isHsnSelected) {
      setHsnResults([]);
      setIsHsnSelected(false);
      return;
    }

    const timer = setTimeout(async () => {
      setHsnLoading(true);
      try {
        const host = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${host}/products/hsn?q=${hsnQuery}`, { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data: HSNRESULTS[] = await response.json();
        setHsnResults(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setHsnLoading(false);
      }
    }, 1600); // Debounce delay in ms

    return () => clearTimeout(timer); // Clean up timer on component unmount
  }, [hsnQuery]);

  const handleHsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHsnQuery(value);
    // Store the search query in productInformation to persist it
    setProductInformation(prev => ({
      ...prev,
      hsnSearchQuery: value
    }));
  };

  const handleSelect = (item: HSNRESULTS) => {
    // Handle item selection
    setHsnQuery(item.hsn_code); // Optionally update input with selected HSN code
    setHsnResults([]);
    setIsHsnSelected(true);
    setProductInformation({
      ...productInformation,
      hsnCode: item.hsn_code,
      category: item.category,
      description: productInformation.description || item.description
    });

  };



  return (
    <div>
      <div className="flex flex-col h-full">
        <h1 className="section-title font-bold mb-6 text-2xl"> Product Information</h1>


        {/* up section  */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="form-field">
            <input
              placeholder="Product Name"
              className="w-full"
              type="text"
              name="name"
              value={productInformation.name}
              onChange={handleChange}
            />
          </div>

        {/*  stock  */}
          <div className="form-field flex flex-row border-2 rounded-lg">
            <input
              type="text"
              placeholder="Stock"
              className="w-full !border-0 !rounded-r-none"
              value={productInformation.stock}
              name="stock"
              onChange={handleChange}
            />
            <select
              className="!w-fit bg-transparent !rounded-l-none !px-2 !border-0"
              name="stockUnit"
              value={productInformation.stockUnit}
              onChange={handleChange}
            >
              <option disabled value={""}>Unit</option>
              <option value="pieces">Pieces</option>
              <option value="boxes">Boxes</option>
              <option value="cartons">Cartons</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="grams">Grams (g)</option>
              <option value="liters">Liters (L)</option>
              <option value="milliliters">Milliliters (mL)</option>
              <option value="meters">Meters (m)</option>
              <option value="centimeters">Centimeters (cm)</option>
              <option value="inches">Inches (in)</option>
              <option value="yards">Yards (yd)</option>
              <option value="sets">Sets</option>
              <option value="dozens">Dozens</option>
              <option value="pallets">Pallets</option>
              <option value="square_meters">Square Meters (m²)</option>
              <option value="square_feet">Square Feet (ft²)</option>
              <option value="cubic_meters">Cubic Meters (m³)</option>
              <option value="cubic_feet">Cubic Feet (ft³)</option>
              <option value="tons">Tons</option>
              <option value="gallons">Gallons</option>
              <option value="pounds">Pounds (lbs)</option>
              <option value="cubic_inches">Cubic Inches (in³)</option>
              <option value="bottles">Bottles</option>
              <option value="packs">Packs</option>
              <option value="bags">Bags</option>
              <option value="sheets">Sheets</option>
              <option value="rolls">Rolls</option>
              <option value="spools">Spools</option>
              <option value="pairs">Pairs</option>
              <option value="containers">Containers</option>
              <option value="pieces_per_box">Pieces per Box</option>
              <option value="feet">Feet (ft)</option>
              <option value="cubic_yards">Cubic Yards (yd³)</option>
            </select>
          </div>

          {/* moq */}
          <div className="form-field flex flex-row border-2 rounded-lg">
            <input
              type="text"
              placeholder="Minimum Order Quantity"
              className="w-full !border-0 !rounded-r-none"
              value={productInformation.moq}
              name="moq"
              onChange={handleChange}
            />
            <select
              className="!w-fit bg-transparent !rounded-l-none !px-2 !border-0"
              name="moqUnit"
              value={productInformation.moqUnit}
              onChange={handleChange}
            >
              <option disabled value={""}>Unit</option>
              <option value="pieces">Pieces</option>
              <option value="boxes">Boxes</option>
              <option value="cartons">Cartons</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="grams">Grams (g)</option>
              <option value="liters">Liters (L)</option>
              <option value="milliliters">Milliliters (mL)</option>
              <option value="meters">Meters (m)</option>
              <option value="centimeters">Centimeters (cm)</option>
              <option value="inches">Inches (in)</option>
              <option value="yards">Yards (yd)</option>
              <option value="sets">Sets</option>
              <option value="dozens">Dozens</option>
              <option value="pallets">Pallets</option>
              <option value="square_meters">Square Meters (m²)</option>
              <option value="square_feet">Square Feet (ft²)</option>
              <option value="cubic_meters">Cubic Meters (m³)</option>
              <option value="cubic_feet">Cubic Feet (ft³)</option>
              <option value="tons">Tons</option>
              <option value="gallons">Gallons</option>
              <option value="pounds">Pounds (lbs)</option>
              <option value="cubic_inches">Cubic Inches (in³)</option>
              <option value="bottles">Bottles</option>
              <option value="packs">Packs</option>
              <option value="bags">Bags</option>
              <option value="sheets">Sheets</option>
              <option value="rolls">Rolls</option>
              <option value="spools">Spools</option>
              <option value="pairs">Pairs</option>
              <option value="containers">Containers</option>
              <option value="pieces_per_box">Pieces per Box</option>
              <option value="feet">Feet (ft)</option>
              <option value="cubic_yards">Cubic Yards (yd³)</option>
            </select>
          </div>
        </div>








        {/* down secition  */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="product-card flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Product Details</h2>

            <div className="form-field">
              {/* Searchable HSN Input */}
              <>
                <input
                  type="text"
                  value={hsnQuery}
                  onChange={handleHsnChange}
                  placeholder="Search your HSN CODE by HSN or description or name"
                />
                {hsnLoading && <p>Loading...</p>}
                {hsnResults.length > 0 && !isHsnSelected && (
                  <ul className="w-fit bg-white border border-gray-300 rounded-md px-4 h-[300px] overflow-y-scroll">
                    {hsnResults.map((item) => (
                      <li
                        key={item._id}
                        onClick={() => handleSelect(item)}
                        className="py-2 px-4 my-3 hover:bg-gray-100 cursor-pointer"
                      >
                        <strong>{item.hsn_code}</strong> - {item.description} - ({item.category})
                      </li>
                    ))}
                  </ul>
                )}
              </>
              <p className="text-xs text-gray-500 mt-1">Harmonized System Nomenclature code for product classification</p>
            </div>

            <div className="form-field mb-6">

              <div className={`w-full ${isHsnSelected ? "text-gray-400" : "text-black"}`}>
                {productInformation.category || "category"}
              </div>
            </div>


          </div>


          <div className="product-card">
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            <div className="mb-4">
              <input
                placeholder="Product summary (short description)"
                className="w-full border border-gray-200 rounded-t-lg px-3 py-2"
                type="text"
                name="description"
                value={productInformation.description}
                onChange={handleChange}
              />
            </div>
            <textarea
              placeholder="Detailed Description - Include product specifications, features, and benefits"
              className="w-full h-[180px] border border-gray-200 rounded-b-lg px-3 py-2"
              name="detailedDescription"
              value={productInformation.detailedDescription}
              onChange={handleChange}
            />
          </div>


        </div>


      </div>
    </div>
  );
};

export default ProductInformation;