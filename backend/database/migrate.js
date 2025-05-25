const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Path to the existing SQLite database file
const DB_PATH = path.join(__dirname, '..', 'breyus.sqlite');
console.log(`Attempting to connect to database at: ${DB_PATH}`);

// Create connection to database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('FATAL: Error connecting to SQLite database:', err.message);
    process.exit(1); // Exit if DB connection fails
  }
  console.log('Successfully connected to the existing SQLite database:', DB_PATH);
});

// Function to execute SQL statements from a file
const runSqlFile = async (filePath) => {
  console.log(`Reading SQL file: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Filter out comments from the SQL to prevent issues with db.exec
  const cleanedSql = sql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n');

  if (cleanedSql.trim().length === 0) {
    console.log(`No executable statements found in ${filePath} after cleaning comments.`);
    return;
  }
  
  console.log(`Executing SQL file: ${filePath}`);

  await new Promise((resolve, reject) => {
    // Use db.exec to run the entire script. 
    // db.exec can handle multiple statements and transactions defined within the SQL file.
    db.exec(cleanedSql, function(err) { 
      if (err) {
        console.error(`Error executing SQL file ${path.basename(filePath)}:`, err.message);
        // It's useful to log the SQL that caused the error, but be mindful of log size for very large SQL files.
        // console.error('Failed SQL Script:\n', cleanedSql); 
        return reject(err);
      }
      console.log(`Successfully executed SQL file: ${path.basename(filePath)}`);
      resolve();
    });
  });
};

// Run migration
const runMigration = async () => {
  console.log('Starting database migration process...');
  try {
    // Drop the old analytics table if it exists
    console.log('Attempting to drop old analytics table...');
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS analytics', function(err) {
        if (err) {
          console.error('Error dropping analytics table:', err.message);
          // Do not reject here, allow script to continue if table just doesn't exist
        } else {
          console.log('Successfully checked and dropped analytics table if it existed (Changes: ' + this.changes + ').');
        }
        resolve();
      });
    });

    // Fix any column name mismatches in views first
    const fixViewSqlPath = path.join(__dirname, 'migrations', 'fix_view_column_mismatches.sql');
    console.log(`Starting view column fixes: ${fixViewSqlPath}`);
    await runSqlFile(fixViewSqlPath);
    console.log('View column fixes completed.');

    // Run feedback tables migration
    const feedbackSqlPath = path.join(__dirname, 'migrations', 'create_feedback_tables.sql');
    console.log(`Starting migration for: ${feedbackSqlPath}`);
    await runSqlFile(feedbackSqlPath);
    console.log('Feedback tables migration completed.');

    // Run script to add seller_id columns to analytics tables
    const alterAnalyticsSqlPath = path.join(__dirname, 'migrations', 'alter_analytics_tables_add_seller_id.sql');
    console.log(`Attempting to add seller_id columns: ${alterAnalyticsSqlPath}`);
    try {
      await runSqlFile(alterAnalyticsSqlPath);
      console.log('Adding seller_id columns step completed.');
    } catch (error) {
      // Check if the error is due to "duplicate column name"
      if (error.message && error.message.toLowerCase().includes('duplicate column name')) {
        console.warn('Warning: seller_id columns likely already exist. Continuing...');
      } else {
        // If it's a different error, re-throw it or handle as critical
        console.error('Error during alter analytics tables script:', error.message);
        throw error; // Or handle more gracefully depending on desired behavior
      }
    }

    // Run analytics tables migration
    const analyticsSqlPath = path.join(__dirname, 'migrations', 'create_analytics_tables.sql');
    console.log(`Starting migration for: ${analyticsSqlPath}`);
    await runSqlFile(analyticsSqlPath);
    console.log('Analytics tables migration completed.');

    // Run buyer addresses and chat system migration
    const buyerAddressesSqlPath = path.join(__dirname, 'migrations', 'create_buyer_addresses.sql');
    console.log(`Starting migration for: ${buyerAddressesSqlPath}`);
    await runSqlFile(buyerAddressesSqlPath);
    console.log('Buyer addresses and chat system migration completed.');

    // Run seed data script
    const seedDataSqlPath = path.join(__dirname, 'migrations', 'seed_analytics_data.sql');
    console.log(`Starting data seeding: ${seedDataSqlPath}`);
    await runSqlFile(seedDataSqlPath);
    console.log('Data seeding completed.');

    console.log('All migrations and seeding completed successfully!');
  } catch (error) {
    console.error('FATAL Error during migration process:', error);
  } finally {
    console.log('Closing database connection...');
    db.close((err) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
      } else {
        console.log('Database connection closed successfully.');
      }
    });
  }
};

// Run the migration
runMigration(); 