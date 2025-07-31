import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Line, Radar } from "react-chartjs-2";
import DOMPurify from "dompurify";
import type { ChartOptions, ChartData, ScriptableLineSegmentContext, RadialLinearScaleOptions } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

// Interfaces for data structures
interface MonthlyDataPoint {
  month_year: string;
  capital_required_per_ton?: number;
  price_fluctuation_percent?: number;
  is_predicted?: boolean;
}

interface CountryDemandDataPoint {
  country_name: string;
  demand_score: number;
}

interface ChartDataPayload<T> {
  data: T[];
  title?: string;
  x_label?: string;
  y_label?: string;
  description?: string;
}

interface Product {
  productName: string;
  price: string;
  countryOfOrigin: string;
  contactNumber: string;
  productDescription: string;
  sellerQuality: string;
  priceFluctuation: string;
}

interface ResultData {
  commodity_analysis: string | null;
  monthly_capital_data: ChartDataPayload<MonthlyDataPoint> | null;
  average_capital_data: { target_value: number; label: string } | null;
  country_demand_data: ChartDataPayload<CountryDemandDataPoint> | null;
  monthly_price_fluctuation_data: ChartDataPayload<MonthlyDataPoint> | null;
  processed_commodity: string;
  processed_export_country: string;
  processed_nearest_port: string;
  products?: Product[];
}

// Chart.js helper functions
const getLineChartData = (
  dataPayload: ChartDataPayload<MonthlyDataPoint> | null,
  valueKey: keyof MonthlyDataPoint,
  chartLabel: string,
  borderColor: string,
  fillColor?: string
): ChartData<"line"> => {
  if (
    !dataPayload ||
    !dataPayload.data ||
    !Array.isArray(dataPayload.data) ||
    dataPayload.data.length === 0
  ) {
    console.warn(`Line chart data is empty or invalid for ${valueKey}:`, dataPayload);
    return { labels: [], datasets: [] };
  }

  const validData = dataPayload.data.filter(
    (item) =>
      item.month_year &&
      typeof item.month_year === "string" &&
      item[valueKey] != null &&
      typeof item[valueKey] === "number" &&
      !isNaN(item[valueKey] as number)
  );

  if (validData.length === 0) {
    console.warn(`No valid data points for line chart (${valueKey}):`, dataPayload.data);
    return { labels: [], datasets: [] };
  }

  const labels = validData.map((item) => item.month_year);
  const dataValues: number[] = validData.map((item) => item[valueKey] as number);

  return {
    labels,
    datasets: [
      {
        label: chartLabel,
        data: dataValues,
        fill: !!fillColor,
        backgroundColor: fillColor || "rgba(0,0,0,0)",
        borderColor,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
        segment: {
          borderDash: (ctx: ScriptableLineSegmentContext) =>
            validData[ctx.p0DataIndex]?.is_predicted ? [6, 6] : undefined,
        },
      },
    ],
  };
};

const getRadarChartData = (
  dataPayload: ChartDataPayload<CountryDemandDataPoint> | null
): ChartData<"radar"> => {
  if (
    !dataPayload ||
    !dataPayload.data ||
    !Array.isArray(dataPayload.data) ||
    dataPayload.data.length === 0
  ) {
    console.warn("Radar chart data is invalid or empty:", dataPayload);
    return { labels: [], datasets: [] };
  }

  const validData = dataPayload.data.filter(
    (item) =>
      item.country_name &&
      typeof item.country_name === "string" &&
      item.demand_score != null &&
      typeof item.demand_score === "number" &&
      !isNaN(item.demand_score)
  );

  if (validData.length === 0) {
    console.warn("No valid data points for radar chart:", dataPayload.data);
    return { labels: [], datasets: [] };
  }

  const labels = validData.map((item) => item.country_name);
  const dataValues: number[] = validData.map((item) => item.demand_score);

  return {
    labels,
    datasets: [
      {
        label: dataPayload.title || "Demand Score",
        data: dataValues,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
      },
    ],
  };
};

const lineChartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top" as const },
    title: { display: true, text: "" },
    tooltip: {
      callbacks: {
        label: (context) => {
          const index = context.dataIndex;
          const dataset = context.dataset;
          const value = context.parsed.y;
          const dataPoint = (context.chart.data.datasets[0].data[index] as any)?.is_predicted
            ? (context.chart.data.datasets[0].data[index] as any)?.is_predicted
            : false;
          const label = dataset.label ?? "Value"; // Fallback to "Value" if label is undefined
          return `${label}: ${value.toFixed(2)}${
            label.includes("Capital") ? " USD/Ton" : " %"
          } ${dataPoint ? "(Predicted)" : ""}`;
        },
      },
    },
  },
  scales: {
    x: { title: { display: true, text: "Month" } },
    y: { title: { display: true, text: "Value" }, beginAtZero: false },
  },
};

const radarChartOptions: ChartOptions<"radar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top", labels: { font: { size: 12 } } },
    title: { display: true, text: "", font: { size: 16 } },
    tooltip: { enabled: true },
  },
  scales: {
    r: {
      angleLines: { display: true, color: "rgba(0, 0, 0, 0.2)" },
      grid: { color: "rgba(0, 0, 0, 0.2)" },
      suggestedMin: 0,
      suggestedMax: 5,
      ticks: {
        stepSize: 1,
        backdropColor: "transparent",
        color: "#555",
        font: { size: 12 },
        showLabelBackdrop: false,
      },
      pointLabels: { font: { size: 12 }, color: "#333" },
    } as RadialLinearScaleOptions,
  },
};

// Product Card Component
interface ProductCardProps {
  productName: string;
  price: string;
  countryOfOrigin: string;
  contactNumber: string;
  productDescription: string;
  sellerQuality: string;
  priceFluctuation: string;
  isMainCard: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  productName,
  price,
  countryOfOrigin,
  contactNumber,
  productDescription,
  sellerQuality,
  priceFluctuation,
  isMainCard,
}) => {
  return (
    <div
      className={`flex flex-col border rounded-lg shadow-md overflow-hidden ${
        isMainCard ? "border-blue-500" : "border-gray-200"
      }`}
    >
      <div className="p-4 bg-gray-50 flex-grow">
        <h3 className="font-bold text-lg mb-2 text-gray-900">
          Product Name:
        </h3>
        <p className="text-xl font-bold text-gray-800 mb-2">{productName}</p>
        <p className="text-gray-600 mb-2">
          Price: <span className="font-semibold">{price}</span>
        </p>
        <p className="text-gray-600 mb-2">
          Country of Origin: <span className="font-semibold">{countryOfOrigin}</span>
        </p>
        <p className="text-gray-600 mb-4">
          Contact number: <span className="font-semibold">{contactNumber}</span>
        </p>
        <h3 className="font-bold text-lg mb-2 text-gray-900">
          Company's Product Description:
        </h3>
        <div
          className="text-sm text-gray-700 leading-relaxed max-h-40 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(productDescription) }}
        />
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700">Seller Quality of Trade</span>
          <span className="font-semibold text-blue-600">{sellerQuality}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-700">Price Fluctuation Predictions</span>
          <span className="font-semibold text-red-600">{priceFluctuation}</span>
        </div>
        <div className="flex space-x-2">
          <button className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Add to Inventory
          </button>
          <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.714-4.631 8.5-10.364 8.5S0 16.714 0 12 4.631 3.5 10.636 3.5 21 7.286 21 12z"
              />
            </svg>
            Chat with Buyer
          </button>
        </div>
      </div>
    </div>
  );
};

// Parse commodity analysis to HTML
const parseCommodityAnalysisToHtml = (text: string): string => {
  if (!text) return "";

  const lines = text.split("\n");
  let html = "";
  let inList = false;
  let inQualityList = false;

  const firstLine = lines[0]?.trim();
  const mainTitleMatch = firstLine?.match(
    /^(?:\*\*Export Market Analysis\*\*)?\s*(.*)$/i
  );
  if (mainTitleMatch) {
    const headingText = mainTitleMatch[1]?.replace(/\*\*/g, "").trim();
    if (headingText) {
      html += `<h2 class="font-bold text-2xl mb-4 text-gray-900">${headingText}</h2>`;
      lines.shift();
    }
  }

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine === "") {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (inQualityList) {
        html += "</ul>";
        inQualityList = false;
      }
      html += '<p class="mb-2"></p>';
      return;
    }

    if (trimmedLine.startsWith("**") && trimmedLine.endsWith("**")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (inQualityList) {
        html += "</ul>";
        inQualityList = false;
      }
      const headingText = trimmedLine.replace(/\*\*/g, "").replace(":", "").trim();
      if (headingText) {
        html += `<h3 class="font-bold text-xl mt-6 mb-2 text-gray-800">${headingText}</h3>`;
      }
    } else if (trimmedLine.match(/^\d+\.\s/)) {
      if (!inList) {
        html += '<ul class="list-none pl-4">';
        inList = true;
      }
      if (inQualityList) {
        html += "</ul>";
        inQualityList = false;
      }
      const parts = trimmedLine.match(/^(\d+\.)\s*([^:]+?)(?::\s*(.*))?$/);
      if (parts) {
        const num = parts[1];
        const title = parts[2].trim();
        const description = parts[3] ? parts[3].trim() : "";
        html += `<li class="mb-2"><strong class="text-gray-800">${num} ${title}</strong>${
          description ? `: ${description}` : ""
        }</li>`;
      } else {
        html += `<li class="mb-2">${trimmedLine}</li>`;
      }
    } else if (
      trimmedLine.startsWith("Typical iron content") ||
      trimmedLine.startsWith("Typical impurity levels") ||
      trimmedLine.startsWith("Typical color") ||
      trimmedLine.startsWith("Typical hardness") ||
      trimmedLine.startsWith("Fat") ||
      trimmedLine.startsWith("Color") ||
      trimmedLine.startsWith("Acidity") ||
      trimmedLine.startsWith("Flavor")
    ) {
      if (!inQualityList) {
        html += '<ul class="list-disc list-inside ml-4 mt-2">';
        inQualityList = true;
      }
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      const parts = trimmedLine.split(":");
      if (parts.length > 1) {
        html += `<li class="mb-1"><strong>${parts[0]}:</strong> ${parts
          .slice(1)
          .join(":")
          .trim()}</li>`;
      } else {
        html += `<li class="mb-1">${trimmedLine}</li>`;
      }
    } else if (
      trimmedLine.includes("Supply/Demand Dynamics:") ||
      trimmedLine.includes("Price Volatility:") ||
      trimmedLine.includes("Global Market Outlook:") ||
      trimmedLine.includes("Logistical Issues:") ||
      trimmedLine.includes("Geopolitical Factors:") ||
      trimmedLine.includes("Quality Concerns:") ||
      trimmedLine.includes("Emerging Markets:") ||
      trimmedLine.includes("Sustainable Sourcing:") ||
      trimmedLine.match(/^\s*\w[\w\s\/]+\s*:/)
    ) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (inQualityList) {
        html += "</ul>";
        inQualityList = false;
      }
      const parts = trimmedLine.split(":");
      const title = parts[0].trim();
      const description = parts.length > 1 ? parts.slice(1).join(":").trim() : "";
      html += `<p class="mb-2"><strong class="text-gray-800">${title}:</strong> ${description}</p>`;
    } else if (trimmedLine) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (inQualityList) {
        html += "</ul>";
        inQualityList = false;
      }
      html += `<p class="mb-2 text-gray-700">${trimmedLine}</p>`;
    }
  });

  if (inList) {
    html += "</ul>";
  }
  if (inQualityList) {
    html += "</ul>";
  }

  return html;
};

// Format currency for display
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

const SellerSearchResult: React.FC = () => {
  const location = useLocation();
  const { state } = location;
  const initialData = state?.result as ResultData | null;
  const initialError = state?.error as string | null;

  const [result, setResult] = useState<ResultData | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);

  const commodity = result?.processed_commodity || state?.commodity || "";
  const country = result?.processed_export_country || state?.country || "";
  const port = result?.processed_nearest_port || state?.port || "";

  // Default product cards (use backend data if available)
  const defaultProducts: Product[] = [
    {
      productName: "Premium Iron Ore Export",
      price: "USD 130/ton",
      countryOfOrigin: "Australia",
      contactNumber: "+61 412 345 678",
      productDescription:
        "<p>High-grade iron ore from Australia, optimized for export with 65% Fe content. Ideal for steel production in Asia-Pacific markets.</p>",
      sellerQuality: "Excellent",
      priceFluctuation: "Stable",
    },
    {
      productName: "Standard Coffee Beans Export",
      price: "USD 4.80/lb",
      countryOfOrigin: "Brazil",
      contactNumber: "+55 11 98765 4321",
      productDescription:
        "<p>Quality Arabica coffee beans from Brazil, perfect for international buyers seeking consistent flavor profiles.</p>",
      sellerQuality: "Good",
      priceFluctuation: "Moderate Volatility",
    },
    {
      productName: "Aged Basmati Rice Export",
      price: "USD 1.60/kg",
      countryOfOrigin: "India",
      contactNumber: "+91 98765 43210",
      productDescription:
        "<p>Premium aged Basmati rice from India, aromatic and long-grained, ready for global distribution.</p>",
      sellerQuality: "Very Good",
      priceFluctuation: "Low",
    },
  ];

  const formattedAnalysisHtml = result?.commodity_analysis
    ? DOMPurify.sanitize(parseCommodityAnalysisToHtml(result.commodity_analysis))
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-black text-white p-4 flex justify-between items-center w-full fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-bold">Breyus Core AI - Seller</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">
            {commodity} from {country} to {port}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-6 pt-20">
        {loading && (
          <div className="text-center text-gray-500 mt-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            Loading analysis...
          </div>
        )}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-6"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        {!loading && !error && !result && (
          <div className="text-center text-gray-500 mt-6">
            No data available. Please ensure all inputs are provided.
            {(!commodity || !port) && (
              <div className="mt-2">
                Missing required parameters (Commodity and Port).
              </div>
            )}
          </div>
        )}

        {result && !error && (
          <>
            <div className="sticky top-16 z-40 bg-gray-100 pt-4 pb-2">
              <div className="bg-white rounded-lg shadow-md w-full mb-6">
                <div className="border border-gray-300 rounded-lg p-6 shadow-sm">
                  <h3 className="font-bold text-xl text-gray-800 mb-4">
                    Export Insights & Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Buyer Demand Radar Chart (First) */}
                    {result.country_demand_data &&
                    result.country_demand_data.data &&
                    result.country_demand_data.data.length > 0 &&
                    result.country_demand_data.data.some(
                      (item) =>
                        item.country_name &&
                        typeof item.demand_score === "number" &&
                        !isNaN(item.demand_score)
                    ) ? (
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center min-h-[250px]">
                        <h4 className="font-semibold text-lg mb-3 text-gray-800 text-center">
                          {result.country_demand_data.title || "Buyer Demand"}
                        </h4>
                        <div className="relative h-[200px] w-full max-w-[400px]">
                          <Radar
                            key="country-demand-chart"
                            data={getRadarChartData(result.country_demand_data)}
                            options={{
                              ...radarChartOptions,
                              plugins: {
                                ...radarChartOptions.plugins,
                                title: {
                                  display: true,
                                  text: result.country_demand_data.title || "Buyer Demand",
                                  font: { size: 16 },
                                },
                                legend: { position: "top", labels: { font: { size: 12 } } },
                                tooltip: { enabled: true },
                              },
                              scales: {
                                r: {
                                  angleLines: { display: true, color: "rgba(0, 0, 0, 0.2)" },
                                  grid: { color: "rgba(0, 0, 0, 0.2)" },
                                  suggestedMin: 0,
                                  suggestedMax: Math.max(
                                    5,
                                    ...(result.country_demand_data.data
                                      .filter((item) => typeof item.demand_score === "number")
                                      .map((item) => item.demand_score)) || [5]
                                  ) + 1,
                                  ticks: {
                                    stepSize: 1,
                                    backdropColor: "transparent",
                                    color: "#555",
                                    font: { size: 12 },
                                    showLabelBackdrop: false,
                                  },
                                  pointLabels: { font: { size: 12 }, color: "#333" },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center min-h-[250px]">
                        <h4 className="font-semibold text-lg mb-3 text-gray-800 text-center">
                          Buyer Demand
                        </h4>
                        <div className="text-sm text-gray-500">
                          No valid buyer demand data available from AI model.
                        </div>
                      </div>
                    )}

                    {/* Monthly Export Capital Line Chart (Second) */}
                    {result.monthly_capital_data &&
                    result.monthly_capital_data.data &&
                    result.monthly_capital_data.data.length > 0 &&
                    result.monthly_capital_data.data.some(
                      (item) =>
                        item.capital_required_per_ton != null &&
                        typeof item.capital_required_per_ton === "number" &&
                        !isNaN(item.capital_required_per_ton)
                    ) ? (
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center min-h-[250px]">
                        <h4 className="font-semibold text-lg mb-3 text-gray-800 text-center">
                          {result.monthly_capital_data.title ||
                            "Monthly Export Capital Required"}
                        </h4>
                        <div className="relative h-[200px] w-full">
                          <Line
                            key="capital-chart"
                            data={getLineChartData(
                              result.monthly_capital_data,
                              "capital_required_per_ton",
                              "Export Capital Required",
                              "#4BC0C0",
                              "rgba(75, 192, 192, 0.2)"
                            )}
                            options={{
                              ...lineChartOptions,
                              plugins: {
                                ...(lineChartOptions.plugins ?? {}),
                                title: {
                                  ...(lineChartOptions.plugins?.title ?? {}),
                                  text:
                                    result.monthly_capital_data?.title ||
                                    "Monthly Export Capital Required",
                                },
                                legend: {
                                  display: true,
                                  position: "top",
                                },
                                tooltip: {
                                  callbacks: {
                                    label: (context) => {
                                      const index = context.dataIndex;
                                      const dataPoint = result.monthly_capital_data?.data[index];
                                      const value = context.parsed.y;
                                      return `Export Capital Required: ${formatCurrency(value)} ${
                                        dataPoint?.is_predicted ? "(Predicted)" : ""
                                      }`;
                                    },
                                  },
                                },
                              },
                              scales: {
                                ...(lineChartOptions.scales ?? {}),
                                y: {
                                  ...(lineChartOptions.scales?.y ?? {}),
                                  title: {
                                    display: true,
                                    text:
                                      result.monthly_capital_data?.y_label ||
                                      "Capital Required (USD/Ton)",
                                  },
                                  suggestedMin: Math.min(
                                    ...(result.monthly_capital_data.data
                                      .filter((item) => item.capital_required_per_ton != null)
                                      .map((item) => item.capital_required_per_ton as number)) || [0]
                                  ) * 0.9,
                                  suggestedMax: Math.max(
                                    ...(result.monthly_capital_data.data
                                      .filter((item) => item.capital_required_per_ton != null)
                                      .map((item) => item.capital_required_per_ton as number)) || [1000]
                                  ) * 1.1,
                                },
                              },
                            }}
                          />
                          {result.average_capital_data && (
                            <div className="text-xs text-gray-600 mt-2 text-center">
                              {result.average_capital_data.label}:{" "}
                              {formatCurrency(result.average_capital_data.target_value)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center min-h-[250px]">
                        <h4 className="font-semibold text-lg mb-3 text-gray-800 text-center">
                          Monthly Export Capital Required
                        </h4>
                        <div className="text-sm text-gray-500">
                          No valid capital data available from AI model.
                        </div>
                      </div>
                    )}

                    {/* Monthly Price Fluctuation Line Chart (Third) */}
                    {result.monthly_price_fluctuation_data &&
                    result.monthly_price_fluctuation_data.data &&
                    result.monthly_price_fluctuation_data.data.length > 0 &&
                    result.monthly_price_fluctuation_data.data.some(
                      (item) =>
                        item.price_fluctuation_percent != null &&
                        typeof item.price_fluctuation_percent === "number" &&
                        !isNaN(item.price_fluctuation_percent)
                    ) ? (
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center min-h-[250px]">
                        <h4 className="font-semibold text-lg mb-3 text-gray-800 text-center">
                          {result.monthly_price_fluctuation_data.title ||
                            "Monthly Price Fluctuation"}
                        </h4>
                        <div className="relative h-[200px] w-full">
                          <Line
                            key="price-fluctuation-chart"
                            data={getLineChartData(
                              result.monthly_price_fluctuation_data,
                              "price_fluctuation_percent",
                              "Price Fluctuation",
                              "#FF6384",
                              "rgba(255, 99, 132, 0.2)"
                            )}
                            options={{
                              ...lineChartOptions,
                              plugins: {
                                ...(lineChartOptions.plugins ?? {}),
                                title: {
                                  ...(lineChartOptions.plugins?.title ?? {}),
                                  text:
                                    result.monthly_price_fluctuation_data?.title ||
                                    "Monthly Price Fluctuation",
                                },
                              },
                              scales: {
                                ...(lineChartOptions.scales ?? {}),
                                y: {
                                  ...(lineChartOptions.scales?.y ?? {}),
                                  title: {
                                    display: true,
                                    text:
                                      result.monthly_price_fluctuation_data?.y_label ||
                                      "Price Fluctuation (%)",
                                  },
                                  suggestedMin: -10,
                                  suggestedMax: 10,
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center min-h-[250px]">
                        <h4 className="font-semibold text-lg mb-3 text-gray-800 text-center">
                          Monthly Price Fluctuation
                        </h4>
                        <div className="text-sm text-gray-500">
                          No valid price fluctuation data available from AI model.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Commodity Analysis Section */}
                  <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6 relative">
                    <h4 className="font-semibold text-lg mb-3 text-gray-800">
                      Export Analysis:
                    </h4>
                    <div
                      className={`text-gray-700 leading-relaxed ${
                        isAnalysisExpanded ? "" : "max-h-40 overflow-hidden"
                      }`}
                      dangerouslySetInnerHTML={{ __html: formattedAnalysisHtml }}
                    />
                    {!isAnalysisExpanded && (
                      <button
                        onClick={() => setIsAnalysisExpanded(true)}
                        className="absolute bottom-4 right-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50"
                      >
                        Read More
                      </button>
                    )}
                    {isAnalysisExpanded && result?.commodity_analysis && (
                      <button
                        onClick={() => setIsAnalysisExpanded(false)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        Show Less
                      </button>
                    )}
                    {!result?.commodity_analysis && !loading && (
                      <p className="text-sm text-gray-500">
                        No export analysis data available from AI model.
                      </p>
                    )}
                  </div>

                  {/* Products Section */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="font-bold text-xl text-gray-800 mb-4">
                      Your Product Listings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                      {(result?.products && result.products.length > 0
                        ? result.products.slice(0, 2)
                        : defaultProducts.slice(0, 2)
                      ).map((product, index) => (
                        <ProductCard
                          key={index}
                          productName={product.productName}
                          price={product.price}
                          countryOfOrigin={product.countryOfOrigin}
                          contactNumber={product.contactNumber}
                          productDescription={product.productDescription}
                          sellerQuality={product.sellerQuality}
                          priceFluctuation={product.priceFluctuation}
                          isMainCard={index === 0}
                        />
                      ))}
                    </div>
                    {!result?.products?.length && !loading && (
                      <p className="text-sm text-gray-500 mt-4 text-center">
                        Displaying default product listings as no specific product data was provided by the AI model.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerSearchResult;