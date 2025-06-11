import { DataSource } from 'typeorm';
import { BarGraph } from '../entities/bar-graph.entity';
import { ScatterGraph } from '../entities/scatter-graph.entity';
import { PieChart } from '../entities/pie-chart.entity';
import { CountrySales } from '../entities/country-sales.entity';

const dataSource = new DataSource({
  type: 'sqlite',
  database: 'breyus.sqlite',
  entities: [BarGraph, ScatterGraph, PieChart, CountrySales],
  synchronize: true,
});

async function insertDummyData() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Sample seller ID
    const sellerId = '1';

    // Insert bar graph data
    const barGraphRepo = dataSource.getRepository(BarGraph);
    await barGraphRepo.save([
      { seller_id: sellerId, date: '2024-03-01', storeVisits: 150, uniqueVisitors: 120 },
      { seller_id: sellerId, date: '2024-03-02', storeVisits: 200, uniqueVisitors: 180 },
      { seller_id: sellerId, date: '2024-03-03', storeVisits: 180, uniqueVisitors: 150 },
      { seller_id: sellerId, date: '2024-03-04', storeVisits: 250, uniqueVisitors: 220 },
      { seller_id: sellerId, date: '2024-03-05', storeVisits: 300, uniqueVisitors: 280 },
    ]);

    // Insert scatter graph data
    const scatterGraphRepo = dataSource.getRepository(ScatterGraph);
    await scatterGraphRepo.save([
      { seller_id: sellerId, day: 'Day 1', x: 1, y: 1000 },
      { seller_id: sellerId, day: 'Day 2', x: 2, y: 1500 },
      { seller_id: sellerId, day: 'Day 3', x: 3, y: 1200 },
      { seller_id: sellerId, day: 'Day 4', x: 4, y: 2000 },
      { seller_id: sellerId, day: 'Day 5', x: 5, y: 1800 },
    ]);

    // Insert pie chart data
    const pieChartRepo = dataSource.getRepository(PieChart);
    await pieChartRepo.save([
      { seller_id: sellerId, category: 'New Customers', value: 40 },
      { seller_id: sellerId, category: 'Returning Customers', value: 60 },
    ]);

    // Insert country sales data
    const countrySalesRepo = dataSource.getRepository(CountrySales);
    await countrySalesRepo.save([
      {
        seller_id: sellerId,
        country: 'United States',
        flag: 'https://flagcdn.com/w40/us.png',
        sales: 1500,
        value: '$15,000',
        bounce: '25%',
        sales_count: 150
      },
      {
        seller_id: sellerId,
        country: 'United Kingdom',
        flag: 'https://flagcdn.com/w40/gb.png',
        sales: 1200,
        value: '$12,000',
        bounce: '20%',
        sales_count: 120
      },
      {
        seller_id: sellerId,
        country: 'Germany',
        flag: 'https://flagcdn.com/w40/de.png',
        sales: 800,
        value: '$8,000',
        bounce: '15%',
        sales_count: 80
      },
      {
        seller_id: sellerId,
        country: 'France',
        flag: 'https://flagcdn.com/w40/fr.png',
        sales: 600,
        value: '$6,000',
        bounce: '18%',
        sales_count: 60
      },
      {
        seller_id: sellerId,
        country: 'Japan',
        flag: 'https://flagcdn.com/w40/jp.png',
        sales: 400,
        value: '$4,000',
        bounce: '22%',
        sales_count: 40
      }
    ]);

    console.log('Dummy data inserted successfully');
  } catch (error) {
    console.error('Error inserting dummy data:', error);
  } finally {
    await dataSource.destroy();
  }
}

insertDummyData(); 